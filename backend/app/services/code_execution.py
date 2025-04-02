import docker
import os
from typing import Tuple
from datetime import datetime
import tempfile
import uuid
import subprocess
import sys
import time
import shutil
import logging
import tarfile
import io

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class CodeExecutionService:
    def __init__(self):
        try:
            self.client = docker.from_env()
            self.use_docker = True
        except docker.errors.DockerException:
            self.use_docker = False
            print("Docker not available, using local Python environment")
        
        self.image_name = "python:3.11-slim"
        self.timeout = 30  # seconds
        self.memory_limit = "100m"  # 100MB memory limit
        self.container = None

    def needs_pandas_or_scipy(self, code: str) -> bool:
        """Check if the code needs pandas or scipy"""
        return 'import pandas' in code or 'import scipy' in code

    def _ensure_container(self, needs_packages: bool):
        """Ensure we have a container with required packages"""
        if needs_packages:
            try:
                # Check if container exists and is running
                if self.container:
                    try:
                        # Try to get container status
                        self.container.reload()
                        if self.container.status == 'running':
                            logger.debug("Using existing container")
                            return
                    except docker.errors.NotFound:
                        logger.debug("Container not found, creating new one")
                        self.container = None
                    except Exception as e:
                        logger.debug(f"Error checking container: {str(e)}")
                        self.container = None

                logger.debug("Creating new container with pandas and scipy")
                # Create a new container with pandas and scipy pre-installed
                self.container = self.client.containers.run(
                    'python:3.9-slim',
                    command='/bin/bash -c "mkdir -p /app && pip install -q --no-warn-script-location pandas scipy && python -c \"import pandas; print(\'pandas installed successfully\')\" && tail -f /dev/null"',
                    detach=True,
                    tty=True,
                    stdin_open=True,
                    remove=True
                )
                
                # Wait for installation to complete and verify
                max_attempts = 10
                for attempt in range(max_attempts):
                    try:
                        # Check if pandas is installed
                        result = self.container.exec_run('python -c "import pandas; print(\'pandas available\')"')
                        if result.exit_code == 0:
                            logger.debug("Container created and packages installed successfully")
                            return
                    except Exception as e:
                        logger.debug(f"Attempt {attempt + 1} failed: {str(e)}")
                    time.sleep(2)  # Wait 2 seconds between attempts
                
                logger.error("Failed to verify pandas installation")
                raise Exception("Failed to install required packages")
            except Exception as e:
                logger.error(f"Error setting up container: {str(e)}")
                if self.container:
                    try:
                        self.container.remove(force=True)
                    except:
                        pass
                    self.container = None
                raise

    async def execute_code(self, code: str) -> Tuple[str, str, str]:
        """
        Execute Python code in a secure Docker container or local environment.
        Returns: (output, status, error_message)
        """
        if self.use_docker:
            return await self._execute_in_docker(code)
        else:
            return await self._execute_locally(code)

    async def _execute_locally(self, code: str) -> Tuple[str, str, str]:
        """Execute code in the local Python environment"""
        try:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name

            # Run the code with timeout
            process = subprocess.Popen(
                [sys.executable, temp_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            try:
                stdout, stderr = process.communicate(timeout=self.timeout)
                status = "success" if process.returncode == 0 else "error"
                return stdout, status, stderr
            except subprocess.TimeoutExpired:
                process.kill()
                return "", "timeout", "Execution timed out"
            finally:
                # Clean up the temporary file
                os.unlink(temp_file)

        except Exception as e:
            return "", "error", str(e)

    async def _execute_in_docker(self, code: str) -> Tuple[str, str, str]:
        """Execute code in a Docker container"""
        # Create a unique container name
        container_name = f"code_execution_{uuid.uuid4().hex[:8]}"
        container = None
        
        try:
            # Create a temporary file with the code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            logger.debug(f"Created temporary file: {temp_file}")

            # Create a temporary directory for mounting
            temp_dir = tempfile.mkdtemp()
            script_path = os.path.join(temp_dir, 'script.py')
            shutil.copy2(temp_file, script_path)
            logger.debug(f"Created script at: {script_path}")
            logger.debug(f"File exists: {os.path.exists(script_path)}")

            # Check if we need pandas or scipy
            needs_packages = self.needs_pandas_or_scipy(code)
            logger.debug(f"Needs packages: {needs_packages}")
            
            try:
                self._ensure_container(needs_packages)
            except Exception as e:
                logger.error(f"Failed to ensure container: {str(e)}")
                return "", "error", "Failed to set up the execution environment. Please try again."

            # Use the pre-configured container if we have one, otherwise use the base image
            if needs_packages and self.container:
                try:
                    logger.debug("Using pre-configured container")
                    # Create a tar archive of the script
                    tar_stream = io.BytesIO()
                    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
                        tar.add(script_path, arcname='script.py')
                    tar_stream.seek(0)
                    
                    # Copy the file into the container
                    self.container.put_archive('/app', tar_stream.getvalue())
                    logger.debug("File copied to container")
                    
                    # Execute the code in the pre-configured container
                    result = self.container.exec_run(
                        f'python /app/script.py',
                        workdir='/app'
                    )
                    output = result.output.decode('utf-8')
                    return output, "success", ""
                except docker.errors.NotFound:
                    logger.debug("Container not found, recreating...")
                    self.container = None
                    return await self._execute_in_docker(code)  # Retry with new container
                except Exception as e:
                    logger.error(f"Error executing in pre-configured container: {str(e)}")
                    return "", "error", "Failed to execute the code. Please try again."
            else:
                logger.debug("Using fresh container")
                # Use a fresh container for simple code
                container = self.client.containers.run(
                    self.image_name,
                    command='/bin/bash -c "mkdir -p /app && python /app/script.py"',
                    volumes={temp_dir: {'bind': '/app', 'mode': 'ro'}},
                    working_dir='/app',
                    name=container_name,
                    mem_limit=self.memory_limit,
                    detach=True
                )

                try:
                    # Wait for the container to finish
                    container.wait(timeout=self.timeout)
                    logs = container.logs().decode('utf-8')
                    return logs, "success", ""
                except Exception as e:
                    logger.error(f"Container execution error: {str(e)}")
                    return "", "error", "Failed to execute the code. Please try again."
                finally:
                    # Clean up
                    try:
                        container.remove(force=True)
                    except:
                        pass
                    shutil.rmtree(temp_dir)
                    os.unlink(temp_file)

        except Exception as e:
            logger.error(f"Error executing code: {str(e)}", exc_info=True)
            return "", "error", "An unexpected error occurred. Please try again."
        finally:
            # Ensure cleanup in case of errors
            try:
                if container:
                    container.remove(force=True)
                shutil.rmtree(temp_dir)
                os.unlink(temp_file)
            except:
                pass

    def cleanup(self):
        """Clean up the container"""
        if self.container:
            try:
                self.container.stop()
                self.container.remove()
                self.container = None
            except:
                pass 