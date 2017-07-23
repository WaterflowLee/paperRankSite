#!coding:utf-8
from flask import request
import json
import pymongo
from . import restful_api
from .. import db
from ..exceptions import GetArgumentsError, InternalError
import os
import numpy as np

from bson.son import SON
# As python dictionaries don't maintain order you should use SON
# or collections.OrderedDict where explicit ordering is required eg $sort

# NO Effect
# @restful_api.after_request
# def after_request(response):
# 	if request.endpoint != 'static':
# 		return response
# 	response.cache_control.max_age = 0
# 	return response


@restful_api.route("/api/time-line/<int:interval>/", methods=["GET"])
def time_line(interval):
	ret = db.time_line.find_one({"_id": interval})
	return json.dumps(ret)


@restful_api.route("/api/cdfs/<int:interval>/", methods=["GET"])
@restful_api.route("/api/cdfs/", methods=["GET"])
def cdfs(interval=None):
	data = []
	if interval is None:
		for cdf in db.cdf.find({}):
			data.append({
				"_id": cdf["_id"],
				"cdf": map(lambda (key, value): (float(key.replace("_", ".")), value), cdf["cdf"].items())
			})
	else:
		pass
	return json.dumps(data)


# @restful_api.route("/api/loss-value-function/<int:interval>/<int:percentage>/", methods=["GET"])
# def loss_value_function(interval, percentage):
# 	loss_value_func = db.loss_value_function.find_one({"interval": interval})
# 	if loss_value_func:
# 		num = int(loss_value_func["count"] * (percentage / (100 * loss_value_func["percentage"])))
# 		data = loss_value_func["loss_value_func"][:num]
# 		return json.dumps(data)
# 	else:
# 		# 实例化产生一个错误类的对象
# 		raise GetArgumentsError("Wrong arguments of GET method in the url result in NoneType database query")


@restful_api.route("/api/loss-value-function", methods=["GET"])
def loss_value_function():
	return json.dumps(json.load(open("paper_rank_site/data/formula_dict.json", "r")))


@restful_api.route("/api/journal-contributions", methods=["GET"])
def journal_contributions():
	# os.getcwd()
	contributions = json.load(open("paper_rank_site/data/contributions.json", "r"))
	contributions_meta = json.load(open("paper_rank_site/data/contributions_meta.json", "r"))

	return json.dumps({
		"contributions": contributions,
		"contributions_meta": contributions_meta
	})


@restful_api.route("/api/corrcoef", methods=["GET"])
def corrcoef():
	return json.dumps(json.load(open("paper_rank_site/data/bivariate.json", "r")))


@restful_api.route("/api/papers/<string:_id>", methods=["GET"])
@restful_api.route("/api/papers/", methods=["GET"])
def papers(_id=None):
	# args A MultiDict
	# with the parsed contents of the query string.(The part in the URL after the question mark).
	not_in = {
		"marginal_loss_value": 0,
		"rank": 0,

	}
	collection = db.papers
	if _id is None:
		start = request.args.get("start", "")
		end = request.args.get("end", "")
		if (start == "") or (end == ""):
			err = "The start and end should not be null"
			raise GetArgumentsError(err)
		elif (int(start) < 1900) or (int(end) > 2015) or (int(end) <= int(start)):
			err = "The start or end are not in range"
			raise GetArgumentsError(err)
		else:
			ret = collection.find({"time": {"$lt": int(end), "$gte": int(start)}},
											{"_id": 1, "loss_value": 1, "reference_normalized_weights": 1, "normalized_journal": 1})
			docs = [doc for doc in ret]
			if not docs:
				err = "Some thing went wrong when querying the DB"
				raise InternalError(err)
			else:
				ret = collection.find({"time": {"$lt": int(end), "$gte": int(start)}})\
					.sort("max_loss_value", pymongo.DESCENDING).limit(1)
				max_loss_value = next(ret)["max_loss_value"]
				return json.dumps({"docs": docs, "max_loss_value": max_loss_value})
	else:
		ret = collection.find_one({"_id": _id}, not_in)
		if ret is not None:
			return json.dumps(ret)
		else:
			raise GetArgumentsError("This document is not in db")


@restful_api.route("/api/mini-net/<string:_id>", methods=["GET"])
def mini_net(_id):
	collection = db.papers
	not_in = {
		"marginal_loss_value": 0,
		"rank": 0,

	}
	ret = collection.find_one({"_id": _id}, not_in)
	# 没有 返回的是 None
	if ret is not None:
		citations = []
		citations_id = ret.get("citations", [])
		for citation_id in citations_id:
			citation = collection.find_one({"_id": citation_id}, not_in)
			if citation is not None:
				citations.append(citation)

		max_loss_value = max(map(lambda p: p["max_loss_value"], citations + [ret]))
		return json.dumps({
			"paper": ret,
			"citations": citations,
			"max_loss_value": max_loss_value
		})
	else:
		raise GetArgumentsError("This document is not in db")
