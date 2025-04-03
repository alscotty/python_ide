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
import re
import io
import contextlib
import asyncio
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class CodeExecutionService:
    def __init__(self):
        self.timeout = 30  # seconds
        self.executor = ThreadPoolExecutor(max_workers=1)  # Single worker to prevent concurrent execution
        
        # Define dangerous operations and imports
        self.dangerous_imports = {
            'os', 'sys', 'subprocess', 'shutil', 'socket', 'multiprocessing',
            'threading', 'ctypes', 'pickle', 'marshal', 'builtins', 'eval',
            'exec', 'compile', 'globals', 'locals', 'vars', 'dir', 'help',
            'open', 'file', 'input', 'raw_input', 'execfile', 'reload',
            'importlib', 'zipimport', 'pkgutil', 'pkg_resources'
        }
        self.dangerous_patterns = [
            r'__import__\s*\(',
            r'eval\s*\(',
            r'exec\s*\(',
            r'compile\s*\(',
            r'open\s*\(',
            r'file\s*\(',
            r'input\s*\(',
            r'raw_input\s*\(',
            r'execfile\s*\(',
            r'reload\s*\(',
            r'os\.system\s*\(',
            r'os\.popen\s*\(',
            r'subprocess\.run\s*\(',
            r'subprocess\.Popen\s*\(',
            r'subprocess\.call\s*\(',
            r'socket\.socket\s*\(',
            r'threading\.Thread\s*\(',
            r'multiprocessing\.Process\s*\('
        ]

    def validate_code(self, code: str) -> Tuple[bool, str]:
        """Validate code for dangerous operations"""
        try:
            # Check for dangerous imports
            for line in code.split('\n'):
                line = line.strip()
                if line.startswith('import ') or line.startswith('from '):
                    for dangerous_import in self.dangerous_imports:
                        if dangerous_import in line:
                            return False, f"Dangerous import detected: {dangerous_import}"
            
            # Check for dangerous patterns
            for pattern in self.dangerous_patterns:
                if re.search(pattern, code):
                    return False, f"Dangerous operation detected: {pattern}"
            
            return True, ""
        except Exception as e:
            return False, f"Error validating code: {str(e)}"

    async def execute_code(self, code: str) -> Tuple[str, str, str]:
        """
        Execute Python code in the local environment.
        Returns: (output, status, error_message)
        """
        # Validate code first
        is_valid, error_message = self.validate_code(code)
        if not is_valid:
            return "", "error", error_message

        return await self._execute_locally(code)

    def _run_code_in_thread(self, code: str) -> Tuple[str, str, str]:
        """Execute code in a separate thread"""
        output_buffer = io.StringIO()
        error_buffer = io.StringIO()

        try:
            with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(error_buffer):
                try:
                    # Compile the code
                    compiled_code = compile(code, '<string>', 'exec')
                    
                    # Execute the code
                    exec(compiled_code, {'__builtins__': __builtins__})
                    
                    # Get the output
                    stdout = output_buffer.getvalue()
                    stderr = error_buffer.getvalue()
                    
                    return stdout, "success", stderr
                    
                except Exception as e:
                    stderr = error_buffer.getvalue()
                    if not stderr:
                        stderr = str(e)
                    return "", "error", stderr

        except Exception as e:
            logger.error(f"Error executing code: {e}")
            return "", "error", str(e)
        finally:
            output_buffer.close()
            error_buffer.close()

    async def _execute_locally(self, code: str) -> Tuple[str, str, str]:
        """Execute code in a separate thread with timeout"""
        try:
            # Run the code in a separate thread with timeout
            loop = asyncio.get_event_loop()
            future = loop.run_in_executor(self.executor, self._run_code_in_thread, code)
            
            try:
                stdout, status, stderr = await asyncio.wait_for(future, timeout=self.timeout)
                return stdout, status, stderr
            except asyncio.TimeoutError:
                return "", "timeout", "Execution timed out"
                
        except Exception as e:
            logger.error(f"Error executing code: {e}")
            return "", "error", str(e)

    def cleanup(self):
        """Clean up any resources"""
        self.executor.shutdown(wait=True) 