from flask import Blueprint
restful_api = Blueprint("restful_api", __name__)
from . import views, errors