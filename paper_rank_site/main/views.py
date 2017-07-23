#!coding:utf-8
from . import main
# from .forms import NameForm
# from .. import db
# from ..models import User
from flask import g, request, redirect, url_for, render_template, flash
import json
import pymongo

# def connect_db():
# 	client = MongoClient()
# 	return client.paper_rank


# @app.before_request
# def before_request():
# 	g.conn = connect_db()

# NO Effect
# @main.after_request
# def after_request(response):
# 	if request.endpoint != 'static':
# 		return response
# 	response.cache_control.max_age = 0
# 	return response


@main.route("/")
def index():
	return "hello world"


def from_collection(top):
	collection = None
	if top == 0:
		collection = g.conn.papers
	elif top == 1:
		collection = g.conn.papers_top_NW
	return collection


@main.route("/papernet/", methods=["GET"])
def papernet():
	return render_template("paper-net.html")


@main.route("/stackedarea/", methods=["GET"])
def stackedarea():
	return render_template("stacked-area.html")


@main.route("/barchart/", methods=["GET"])
def barchart():
	return render_template("bar-chart.html")


@main.route("/linechart/", methods=["GET"])
def linechart():
	return render_template("line-chart.html")


@main.route("/scatterchart/", methods=["GET"])
def scatterchart():
	return render_template("scatter-chart.html")


@main.route("/estimate-loss-function/", methods=["GET"])
def estimate_loss_function():
	return render_template("estimate-loss-function.html")


@main.route("/figures/", methods=["GET"])
def figures():
	return render_template("figures.html")


# 直接返回数据对象[], {}是不行的，必须经过 json.dumps() 字符串化
@main.route("/data/<path:filename>", methods=["GET"])
def echo_json(filename):
	# print os.getcwd()
	try:
		fp = open("paper_rank_site/data/%s" % filename, "r")
	except IOError:
		return json.dumps({"status": "Resource not available"})
	data = json.load(fp)
	fp.close()
	return json.dumps(data)

