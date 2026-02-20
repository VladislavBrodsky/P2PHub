"""
Legacy wrapper for ViralMarketingStudio.
Functionality has been modularized into app.services.viral_studio package.
"""
import logging

from .viral_studio import viral_studio
from .viral_studio.tasks import log_rss_to_sheets_task, log_viral_generation_task

logger = logging.getLogger(__name__)

# Re-export singleton for backward compatibility
ViralMarketingStudio = viral_studio.__class__
viral_studio = viral_studio

__all__ = ["ViralMarketingStudio", "log_rss_to_sheets_task", "log_viral_generation_task", "viral_studio"]
