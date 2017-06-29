var fs = require('fs');
var express = require('express');
var app = express();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = process.env.MONGO_URL;
var Bing = require('node-bing-api')({accKey: process.env.BING_KEY1});

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    });

app.route('/search/:searchTerms*')
   .get(function(req, res) 
    {
       var theSearch = req.params.searchTerms;
       var page = req.query.offset;
       console.log(page);
       MongoClient.connect(url,function(err,db){
         if(err)
         {
           console.log("error connecting to database: "+err)
         }
         else
         {
           var date = new Date();
           var searches = db.collection('searches');
           var addOne = function(db,callback)
                        {
                          searches.insert({
                                      terms: theSearch,
                                      date: date
                                   },
                                   function(err,db){
                                      if(err) throw err;
                                   });
                        }
           addOne(db,function(){
             db.close();
           });
         }
       });
      var whichPage=0;
      if(page)
      {
        whichPage=(page*10);
      }
      else
      {
        whichPage=3;
      }
      console.log("Skipping: " + whichPage);
      var resultsArr = [];
      Bing.images(theSearch, {
          top: 10,   
          skip: whichPage    
        }, 
        function(err, result, body)
        {
          if(err) console.log("Error: " + err);
          console.log("Activating")
          
          for(var i=0;i<body.value.length;i++)
          {
            resultsArr.push(
              {
                name: body.value[i].name,
               webSearchUrl: body.value[i].webSearchUrl,
               hostPage: body.value[i].hostPageDisplayUrl
              }
            );
          }   
          res.send(resultsArr);
        });        
	     
    });

app.route('/recent')
   .get(function(req,res){
   MongoClient.connect(url,function(err,db){
     if(err)
     {
       console.log("error connecting to database: "+err)
     }
     else
     {
        var searches = db.collection('searches');
        searches.find({},{_id:0})
         .toArray(function(err,docs){
           console.log("Array Length: " + docs.length);
           if(err) throw err;
           var tenMostRecent = [];
           if(docs.length<11)
             res.json(docs);
           else
           {
             for(var x=1;x<11;x++)
             {
               tenMostRecent.push(docs[docs.length-x]);
             }
             res.json(tenMostRecent);
           }
           db.close();
          });  
     }     
   });
  
});

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});
