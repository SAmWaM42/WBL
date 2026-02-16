import regex as rg
import sys
import json
import pickle

# zxcvn
# clean and remove no from the text
# check password 
def validatePass(string, username):
    errors = []
    if not rg.search("[A-Z]", string):
        errors.append("no Capital letters")
    if not rg.search("[0-9]", string):
        errors.append("no Numbers")
    if not rg.search(r"[^a-zA-Z0-9]", string):
        errors.append("no Special Characters")
    if username.lower() in string.lower():
        errors.append("cannot use username in password")
    if len(list(string))<8:
        errors.append("password is too short")
    #removed this for performance reasons for now
    '''if not errors:
        #wordList = pickle.load(open("rockyou.pkl","rb"))
        if string.lower() in wordList:
          errors.append("password too common")'''

    if(len(errors)>0):
        return errors
    else:
        return True


print(json.dumps(validatePass(sys.argv[1], sys.argv[2])))

