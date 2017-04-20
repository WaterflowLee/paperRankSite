from pymongo import MongoClient
client = MongoClient()
conn = client.paper_rank
end = 1990
start = 1960
ret = conn.papers_top_LV.find({"time":{"$lt":int(end), "$gte":int(start)}},\
				{"_id":1, "loss_value":1, "reference_normalized_weights":1})
print next(ret, "nihao")
pipeline = [{"$match":{"time":{"$lt":int(end), "$gte":int(start)}}},
			# {"$unwind":"$loss_value"},
			{"$project":{"max_loss_value":{"$max":"$loss_value.30"}, "min_loss_value":{"$min":"$loss_value.30"}}}]
ret = conn.papers.aggregate(pipeline)
print ret.next()