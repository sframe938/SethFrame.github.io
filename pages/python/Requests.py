#!C:/Python27/python.exe
# -*- coding: UTF-8 -*-

import cgi, cgitb, pymssql, sys, os, csv
cgitb.enable()

print "Content-Type: text/plain;charset=utf-8"
print

ProjectsCSV = r"C:\inetpub\wwwroot\TraversaProjects\data\traversa_projects.csv"
ContactsCSV = r"C:\inetpub\wwwroot\TraversaProjects\data\contacts.csv"

host = "XXXXXXXXXXXX"
username = "XXXXXX"
password = "XXXXXX"
database = "Traversa_Projects"

form = cgi.FieldStorage()

adminType = form.getvalue("adminType")

## Database Management
if adminType == "new":
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	sql = "INSERT INTO TraversaProjects ("
	values = "("
	
	tylerID = form.getvalue("tylerID")
	if tylerID != None:
		sql = sql + "TylerID"
		values = values + "'" + tylerID + "'"
	else:
		print "No TylerID Provided!"
		sys.exit()
		
	newProjectName = form.getvalue("newProjectName")
	if newProjectName != None:
		sql = sql + ", Project"
		values = values + ", '" + newProjectName + "'"
	else:
		print "No Project Name Provided!"
		sys.exit()
		
	startDate = form.getvalue("startDate")
	if startDate != None:
		sql = sql + ", Start"
		values = values + ", '" + startDate + "'"
	
	status = form.getvalue("status")
	if status != None:
		sql = sql + ", Status"
		values = values + ", '" + status.title() + "'"
	
	assignment = form.getvalue("assignment")
	if assignment != None:
		sql = sql + ", Assignment"
		values = values + ", '" + assignment.split(",")[1] + "'"

	comments = form.getvalue("comments")
	if comments != None:
		sql = sql + ", Comments"
		values = values + ", '" + comments + "'"
	
	subregions = form.getvalue("subregions")
	if subregions != None:
		sql = sql + ", GEOID"
		if isinstance(subregions, (list,)):
			valuesSub = ""
			for sub in subregions:
				valuesSub = valuesSub + values + ", '" + sub.split(",")[2]+"'), "
			values = valuesSub.rstrip(", ")
		else:
			values = values + ", '" + subregions.split(",")[2] + "')"
	else:
		values = values + ")"
	sql = sql + ") VALUES " + values 
	cur.execute(sql)
	conn.commit()
	conn.close()
	
	adminType = "tables"
else:
	pass

if adminType == "update":
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	
	sql = "UPDATE TraversaProjects SET "
	ProjectName = form.getvalue("projects")
	if ProjectName != None:
		where = " WHERE TylerID = '" + ProjectName.split(",")[1] + "'"
	else:
		print "No Project Selected!"
		sys.exit()
	
	startDate = form.getvalue("startDate")
	if startDate != None:
		sql = sql + "Start = '" + startDate + "', "
	
	status = form.getvalue("status")
	if status != None:
		sql = sql + "Status = '" + status.title() + "', "

	assignment = form.getvalue("assignment")
	if assignment != None:
		sql = sql + "Assignment = '" + assignment.split(",")[1] + "', "
		
	comments = form.getvalue("comments")
	if comments != None:
		sql = sql + "Comments = '" + comments + "'"
		
	sql = sql.rstrip(", ") + where
	
	if startDate == None and status == None and assignment == None and comments == None:
		pass
	else:
		cur.execute(sql)
		conn.commit()
		conn.close()
	
	subregions = form.getvalue("subregions")
	if subregions != None:
		if isinstance(subregions, (list,)):
			for sub in subregions:
				conn = pymssql.connect(host, username, password, database)
				cur = conn.cursor()
				sql = "INSERT INTO TraversaProjects (TylerID, Project, Add_City, Add_State, Add_Zip, Start, Finish, Status, Assignment, Comments, GEOID) SELECT TOP 1 TylerID, Project, Add_City, Add_State, Add_Zip, Start, Finish, Status, Assignment, Comments, " + "'" + sub.split(",")[2] + "' FROM TraversaProjects" + where 
				cur.execute(sql)
				conn.commit()
				conn.close()
		else:
			conn = pymssql.connect(host, username, password, database)
			cur = conn.cursor()
			sql = "INSERT INTO TraversaProjects (TylerID, Project, Add_City, Add_State, Add_Zip, Start, Finish, Status, Assignment, Comments, GEOID) SELECT TOP 1 TylerID, Project, Add_City, Add_State, Add_Zip, Start, Finish, Status, Assignment, Comments, " + "'" + subregions.split(",")[2] + "' FROM TraversaProjects" + where
			cur.execute(sql)
			conn.commit()
			conn.close()
	
	adminType = "tables"
else:
	pass
			
if adminType == "delete":
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	
	sql = "DELETE FROM TraversaProjects"
	ProjectName = form.getvalue("projects")
	if ProjectName != None:
		where = " WHERE TylerID = '" + ProjectName.split(",")[1] + "'"
	else:
		print "No Project Selected!"
		sys.exit()
		
	sql = sql + where
	cur.execute(sql)
	conn.commit()
	
	adminType = "tables"
else:
	pass

if adminType == "tables": 
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	os.remove(ProjectsCSV)
	cur.execute("SELECT * FROM TraversaProjects")
	with open(ProjectsCSV,"wb") as outfile:
		writer = csv.writer(outfile)
		writer.writerow([col[0] for col in cur.description])
		for row in cur:
			writer.writerow(row)
	conn.close()
else: 
	pass

## Contact Management
if adminType == "viewContact":
	pass
else:
	pass

if adminType == "newContact":
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	
	sql = "INSERT INTO Data_Contacts ("
	values = "("
	
	ContactName = form.getvalue("name")
	if ContactName != None:
		sql = sql + "Contact_Name"
		values = values + " '" + ContactName + "'"
	else:
		print "No Contact Name Provided!"
		sys.exit()
	
	contactPhone = form.getvalue("phone")
	if contactPhone != None:
		sql = sql + ", Phone"
		values = values + ", '" + contactPhone + "'"
		
	contactEmail = form.getvalue("email")
	if contactEmail != None:
		sql = sql + ", Email"
		values = values + ", '" + contactEmail + "'"
	
	address = form.getvalue("address")
	if address != None:
		sql = sql + ", Address"
		values = values + ", '" + address + "'"
	
	website = form.getvalue("website")
	if website != None:
		sql = sql + ", Website"
		values = values + ", '" + website + "'"
	
	gisData = form.getvalue("data")
	if gisData != None:
		sql = sql + ", GIS_Data"
		values = values + ", '" + gisData + "'"
	
	dataFee = form.getvalue("fee")
	if dataFee != None:
		sql = sql + ", Data_Fee"
		values = values + ", '" + dataFee + "'"
		
	desc = form.getvalue("desc")
	if desc != None:
		sql = sql + ", Description"
		values = values + ", '" + desc + "'"
	
	subregions = form.getvalue("subregions")
	if subregions != None:
		sql = sql + ", County_District, State_Province, GEOID"
		values = values + ", '" + subregions.split(",")[0] + "', '" + subregions.split(",")[3] + "', '" + subregions.split(",")[2] + "')"
	else:
		print "No Contact County or District Selected!"
		sys.exit()
	
	sql = sql + ") VALUES " + values
	# print sql
	cur.execute(sql)
	conn.commit()
	conn.close()
	
	adminType = "contacttables"
else:
	pass

if adminType == "updateContact":
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	
	sql = "UPDATE Data_Contacts SET "
	contactLocation = form.getvalue("contacts")
	if contactLocation != None:
		where = " WHERE GEOID = '" + contactLocation.split(",")[0] + "'"
	else:
		print "No Contact Location Selected!"
		sys.exit()
	
	ContactName = form.getvalue("name")
	if ContactName != None:
		sql = sql + "Contact_Name = '" + ContactName + "', "
	
	contactPhone = form.getvalue("phone")
	if contactPhone != None:
		sql = sql + "Phone = '" + contactPhone + "', "
	
	contactEmail = form.getvalue("email")
	if contactEmail != None:
		sql = sql + "Email = '" + contactEmail + "', "
	
	address = form.getvalue("address")
	if address != None:
		sql = sql + "Address = '" + address + "', "
	
	website = form.getvalue("website")
	if website != None:
		sql = sql + "Website = '" + website + "', "
	
	gisData = form.getvalue("data")
	if gisData != None:
		sql = sql + "GIS_Data = '" + gisData + "', "
	
	dataFee = form.getvalue("fee")
	if dataFee != None:
		sql = sql + "Data_Fee = '" + dataFee + "', "
		
	desc = form.getvalue("desc")
	if desc != None:
		sql = sql + "Description = '" + desc + "', "
	
	sql = sql.rstrip(", ") + where
	# print sql
	cur.execute(sql)
	conn.commit()
	conn.close()
	
	adminType = "contacttables"
else:
	pass

if adminType == "deleteContact":
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	
	sql = "DELETE FROM Data_Contacts"
	contactLocation = form.getvalue("contacts")
	if contactLocation != None:
		where = " WHERE GEOID = '" + contactLocation.split(",")[0] + "'"
	else:
		print "No Contact Location Selected!"
		sys.exit()
	
	sql = sql + where
	# print sql
	cur.execute(sql)
	conn.commit()
	conn.close()
	
	adminType = "contacttables"
else:
	pass

if adminType == "contacttables":
	conn = pymssql.connect(host, username, password, database)
	cur = conn.cursor()
	os.remove(ContactsCSV)
	cur.execute("SELECT * FROM Data_Contacts")
	with open(ContactsCSV,"wb") as outfile:
		writer = csv.writer(outfile)
		writer.writerow([col[0] for col in cur.description])
		for row in cur:
			try:
				writer.writerow(row)
			except:
				print row
	conn.close()
else:
	pass


