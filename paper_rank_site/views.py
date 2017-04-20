#!coding:utf-8
from paper_rank_site import app

from flask import g, request, redirect, url_for, render_template, flash
import json
from pymongo import MongoClient
import pymongo
def connect_db():
	client = MongoClient()
	return client.paper_rank 
@app.before_request
def before_request():
	g.conn = connect_db()
@app.after_request
def after_request(response):
	if request.endpoint != 'static':
		return response
	response.cache_control.max_age = 0
	return response

@app.route("/")
def index():
	return "hello world"
# 我记得这里可以通过加 default 参数 实现多个route的叠加, 但是忘记了具体的做法
def fromCollection(top):
	if top==0:
		collection = g.conn.papers
	elif top==1:
		collection = g.conn.papers_top_NW
	return collection
@app.route("/paper/<int:top>/<id>", methods=["GET"])
def paper(top, id):
	collection = fromCollection(top)
	ret = collection.find_one({"_id":id})
	if ret is not None:
		return json.dumps(ret)
	else:
		return json.dumps({"result":"The id is wrong!"})
@app.route("/papers/<int:top>/", methods=["GET", "POST"])
def papers(top):
	collection = fromCollection(top)
	err = ""
	if request.method == "GET":
		return render_template("papers.html", err=err)
	elif request.method == "POST":
		start = request.form.get("start", "")
		end = request.form.get("end", "")
		print start
		print end
		if (start == "") or (end == ""):
			err = "The start and end should not be null"
			return render_template("papers.html", err=err)
		else:
			ret = collection.find({"time":{"$lt":int(end), "$gte":int(start)}},\
				{"_id":1, "loss_value":1, "reference_normalized_weights":1})
			docs = [doc for doc in ret]
			if docs == []:
				err = "Some thing went wrong when querying the DB"
				return render_template("papers.html", err=err)
			else:
				ret = collection.find({"time":{"$lt":int(end), "$gte":int(start)}})\
					.sort("max_loss_value", pymongo.DESCENDING).limit(1)
				max_loss_value = next(ret)["max_loss_value"]
				return json.dumps({"docs":docs,
									"max_loss_value":max_loss_value})
@app.route("/papernet/", methods=["GET"])
def papernet():
	return render_template("papernet.html")
@app.route("/stackedarea/", methods=["GET"])
def stackedarea():
	return render_template("stackedarea.html")