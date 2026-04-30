import random
import pandas as pd
import sys


#read dataset from file entered in terminal when running
#split data set into classes and read from unique users which is set in another sheet
#use a filtering system that loops over the  total no of requests picks a user then removes them till all is satisfied
#need to read and format the data and look at output structure 
#need to set data like this first

file1=pd.DataFrame(pd.read_excel(sys.argv[1],sheet_name="Sheet2"))
file2=pd.DataFrame( pd.read_excel(sys.argv[1],sheet_name="Sheet1"))

#store unused columns
#drop them from actionable data set
assignedTickets={}
assigned=file2.dropna(subset=["User"])
#group asssigned tickets by user
userNames=set(file2["User"])
assignedTickets = (
    assigned
    .groupby("User")
    .apply(lambda x: x.to_dict("records"))
    .to_dict())

#ensure that a record is created for every user whether they have a ticket or not
for name in userNames:
    if(name not in assignedTickets.keys()):
        assignedTickets[name]=[]
unAssigned=file2[file2["User"].isna()]
unAssigned=unAssigned.drop(columns=["User"])
unAssigned=unAssigned.sort_values(by="Priority",ascending=False)  
ticketStats=file1.set_index("Row Labels")["Count of User"].to_dict()
ticketStats.pop("Grand Total")


def selectUsers():
    #This ensure it prioritizes users with the least amount  of tickets
    max_count = max(ticket for ticket in ticketStats.values())
    if all(ticket == max_count for ticket in ticketStats.values()):
        return  [ticket for ticket in ticketStats.keys()]
    else:
        return [ticket for ticket in ticketStats.keys() if ticketStats[ticket] < max_count]
    

def assignTickets():
    global assignedTickets
    global ticketStats  
    validUsersToUse=list()
    #This ensure it prioritizes users with the least amount  of tickets
    validUsersToUse=selectUsers()
    # This ensures that it prioritizes the older tickets   
    for index,ticket in unAssigned.iterrows():  
            user=random.choice(validUsersToUse)
            print(user)
            assignedTickets[user].append(ticket.to_dict())
            ticketStats[user]=ticketStats[user]+1
            validUsersToUse.remove(user)     
            if(len(validUsersToUse)==0):
             validUsersToUse=selectUsers()
            

assignTickets()
fDF=pd.DataFrame([{"User":key,**item}
                  for key,values in assignedTickets.items()
                  for item in values]
)
disDf=pd.DataFrame( [(key, val) for key,val in ticketStats.items()],
    columns=["User", "Value"])
fileName=sys.argv[2]
with pd.ExcelWriter(fileName, engine="openpyxl") as writer:
    fDF.to_excel(writer, sheet_name="Sheet1", index=False)
    disDf.to_excel(writer, sheet_name="Sheet2", index=False)

#finish by converting the assigned tickets and ticket stats to a dataframe and writing to an xml file
