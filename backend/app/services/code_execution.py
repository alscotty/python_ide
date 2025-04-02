import docker
import os
from typing import Tuple
from datetime import datetime
import tempfile
import uuid
import subprocess
import sys

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
        
        try:
            # Create a temporary file with the code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name

            # Pull the image if it doesn't exist
            try:
                self.client.images.get(self.image_name)
            except docker.errors.ImageNotFound:
                self.client.images.pull(self.image_name)

            # Create and run the container
            container = self.client.containers.run(
                self.image_name,
                command=f"python {os.path.basename(temp_file)}",
                volumes={os.path.dirname(temp_file): {'bind': '/app', 'mode': 'ro'}},
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
            except docker.errors.NotFound:
                return "", "error", "Container not found"
            finally:
                # Clean up
                try:
                    container.remove(force=True)
                except:
                    pass
                os.unlink(temp_file)

        except Exception as e:
            return "", "error", str(e)
        finally:
            # Ensure cleanup in case of errors
            try:
                container.remove(force=True)
                os.unlink(temp_file)
            except:
                pass 