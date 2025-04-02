import docker
import os
from typing import Tuple
from datetime import datetime
import tempfile
import uuid

class CodeExecutionService:
    def __init__(self):
        self.client = docker.from_env()
        self.image_name = "python:3.11-slim"
        self.timeout = 30  # seconds
        self.memory_limit = "100m"  # 100MB memory limit

    async def execute_code(self, code: str) -> Tuple[str, str, str]:
        """
        Execute Python code in a secure Docker container.
        Returns: (output, status, error_message)
        """
        # Create a unique container name
        container_name = f"code_exec_{uuid.uuid4().hex[:8]}"
        
        try:
            # Create a temporary file for the code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file_path = f.name

            # Create and run the container
            container = self.client.containers.run(
                self.image_name,
                command=f"python {os.path.basename(temp_file_path)}",
                volumes={os.path.dirname(temp_file_path): {'bind': '/app', 'mode': 'ro'}},
                working_dir='/app',
                name=container_name,
                mem_limit=self.memory_limit,
                network_disabled=True,
                detach=True
            )

            # Wait for the container to finish
            try:
                container.wait(timeout=self.timeout)
            except docker.errors.Timeout:
                container.kill()
                return "", "error", "Execution timed out"

            # Get the output
            output = container.logs().decode('utf-8')
            
            # Clean up
            container.remove(force=True)
            os.unlink(temp_file_path)

            return output, "success", None

        except Exception as e:
            return "", "error", str(e)
        finally:
            # Ensure cleanup in case of errors
            try:
                container.remove(force=True)
                os.unlink(temp_file_path)
            except:
                pass 