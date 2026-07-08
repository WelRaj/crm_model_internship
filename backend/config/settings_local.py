from .settings_base import *  # noqa: F403


DEBUG = True
ALLOWED_HOSTS = [*ALLOWED_HOSTS, "testserver"]  # noqa: F405
