# co-organizer

## Firebase
The firebase admin SDK json file is base 64 encoded to be able to work in fly.io secrets. Dowload the json file from
Firebase and do the following.

`base64  co-organizer-firebase-adminsdk-4bc6a-f64a0f0c66.json > test.txt`

This will save the content of the json file in the test.txt file. You should set the key in .env file the following way.

FIREBASE_ADMIN_SDK=`The content of the test.txt file`

