from . import restful_api
from ..exceptions import GetArgumentsError, InternalError
import json
from flask import jsonify


def bad_request(message):
	# AttributeError: 'str' object has no attribute 'status_code'
	# response = json.dumps({'error': 'bad request', 'message': message})
	response = jsonify({'error': 'bad request', 'message': message})
	response.status_code = 400
	return response


@restful_api.errorhandler(GetArgumentsError)
def get_arguments_error(e):
	return bad_request(e.args[0])


def bad_server(message):
	response = jsonify({'error': 'bad server', 'message': message})
	response.status_code = 500
	return response


@restful_api.errorhandler(InternalError)
def internal_error(e):
	return bad_server(e.args[0])

