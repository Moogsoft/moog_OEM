/************************************************************
 *                                                          *
 *  Contents of file Copyright (c) Moogsoft Inc 2014        *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *  WARNING:                                                *
 *  THIS FILE CONTAINS UNPUBLISHED PROPRIETARY              *
 *  SOURCE CODE WHICH IS THE PROPERTY OF MOOGSOFT INC AND   *
 *  WHOLLY OWNED SUBSIDIARY COMPANIES.                      *
 *  PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:        *
 *                                                          *
 *  This source code is confidential and any person who     *
 *  receives a copy of it, or believes that they are viewing*
 *  it without permission is asked to notify Phil Tee       *
 *  on 07734 591962 or email to phil@moogsoft.com.          *
 *  All intellectual property rights in this source code    *
 *  are owned by Moogsoft Inc.  No part of this source      *
 *  code may be reproduced, adapted or transmitted in any   *
 *  form or by any means, electronic, mechanical,           *
 *  photocopying, recording or otherwise.                   *
 *                                                          *
 *  You have been warned....so be good for goodness sake... *
 *                                                          *
/************************************************************/


var fs = require('fs');
var net = require('net');
var oracle= require('oracle');


var LAM_SOCKET_PORT = 8418;
var logFilename = '/var/log/moogsoft/db_lam.log';

var connString = "(DESCRIPTION=(ADDRESS_LIST=(LOAD_BALANCE=ON)(FAILOVER=ON)(ADDRESS=(PROTOCOL=TCP)(HOST=emprd1-db.cisco.com)(PORT=1536))(ADDRESS=(PROTOCOL=TCP)(HOST=emprd2-db.cisco.com)(PORT=1536)))(CONNECT_DATA=(SERVICE_NAME=EMPRD.cisco.com)(SERVER=DEDICATED)))";

var connectData = { "tns": connString, "user": "MGMREPORT", "password": "********" };

var responseData='';

var client = net.connect({host:'moog-poc-03', port: LAM_SOCKET_PORT},function(){

    oracle.connect(connectData, function(error, connection) {

        if (error) { log("Error connecting to db:", error); }

        else{

            var reader = connection.reader("SELECT target,hostname,severity,round((new_time(FIRST_OCCURENCE, 'PDT', 'GMT') - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) *24 * 60 * 60) as first_occurence,round((new_time(LAST_OCCURENCE, 'PDT', 'GMT') - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) *24 * 60 * 60) as last_occurence, description,type FROM DBAlerts_4_Moog where  LAST_OCCURENCE  > sysdate - (1/(24*60))*2 order by LAST_OCCURENCE desc" , []);


            function doRead(cb) {
                reader.nextRow(function(error, row) {
                    if (error) {return cb(error);}
                    if (row) {
                        client.write(JSON.stringify(row)+':):)'); 
                        log(JSON.stringify(row));
                        return doRead(cb)
                    } else {
                        return cb();
                    }
                })
            }

            doRead(function(error) {
                if (error) {throw error;}
                log("all records processed");
                connection.close(); // call only when query is finished executing
                client.end();
            });


        }

    });

});


function log(entry){

  var now = new Date();
  fs.appendFile(logFilename,"["+now.toString()+"] "+entry+"\n",function(error){if(error){console.log(error);}});
  console.log(entry);

}
