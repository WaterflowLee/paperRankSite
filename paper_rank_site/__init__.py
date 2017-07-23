from flask import Flask, request
from config import config
from pymongo import MongoClient


# package global variables
client = MongoClient()
db = client.paper_rank


def create_app(config_name):
	app = Flask(__name__)
	app.config.from_object(config[config_name])
	config[config_name].init_app(app)
	# attach routes and custom error pages here
	# import paper_rank_site.views
	from main import main as main_blueprint
	app.register_blueprint(main_blueprint)
	from restful_api import restful_api
	app.register_blueprint(restful_api)

	@app.after_request
	def after_request(response):
		if request.endpoint != 'static':
			return response
		response.cache_control.max_age = 0
		return response

	return app
