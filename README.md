# user-authentication
Project that covers diverse kinds of authentication, using node.js

Commit 1 3a2c2e9b0b530455a72ddcdd6c30551da4c91d81
Using Username and Password on Mongose database for register and login user

Commit 2 8a41dc05d66aaf3f3376002acfd7fe9f5ec55483
We add encryption and enviroment variables using mongoose-encryption and dotenv

Commit 3 c8521071b36b239f98fa0ee381b670e70223cda8
We replaced mongoose-encryption for Hash Password md5

Commit 4 cd4e846835a1d838b53e31eb7d189204c344724f
We replaced md5 for bcrypt and added salting to the hash

Commit 5 3b63a9d1699e6f1edf6f98554d7b0cbdc621445c
We add passport, session and cookies, and removed bcrypt

Commit 6 a3d67ed6eccbf74b09d9332691e452c6a8c8ee8a
Adding OAuth ussing passport for facebook and for google

Commit 7 ceff799a7a14855a0289c36c9cafb047303366cd
Create the submit secret functionality