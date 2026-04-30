import pickle

with open("rockyou.txt",errors="ignore") as f:
    s = set(w.strip() for w in f)

pickle.dump(s, open("rockyou.pkl", "wb"))

#password recommendations
