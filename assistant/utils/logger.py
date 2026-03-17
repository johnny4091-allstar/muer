"""Structured logging utility for Muer Voice Assistant."""

import logging
import sys
from pathlib import Path


def get_logger(name: str = "muer-assistant") -> logging.Logger:
    from assistant.config import config  # noqa: PLC0415

    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # already configured

    level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(level)

    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # File handler
    try:
        fh = logging.FileHandler(config.LOG_FILE)
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except OSError:
        pass  # Can't write log file — continue with console only

    return logger
