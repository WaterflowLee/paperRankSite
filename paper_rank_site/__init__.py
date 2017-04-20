from flask import Flask 
app = Flask(__name__)
app.secret_key = "some secret"
import paper_rank_site.views