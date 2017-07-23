#!coding: utf-8
import json
contributions = json.load(open("contributions.json", "r"))
contributions_meta = json.load(open("contributions_meta.json", "r"))
order = []
for journal in contributions_meta["all_in"]:
	if journal not in contributions_meta["TOP5"]:
		value = 0
		for contribution in contributions:
			value += contribution[journal]
		order.append((journal, value))
# sorted not in place
order = sorted(order, key=lambda x: x[1], reverse=True)
order = map(lambda x: x[0], order)
contributions_meta["OthersInOrder"] = order
json.dump(contributions_meta, open("contributions_meta.json", "w"), indent=2)
