import json
from . import restful_api
from .. import db

@restful_api.route("/api/time-line/<int:start>/<int:end>/<int:interval>", methods=["GET"])
def time_line(start, end, interval):
