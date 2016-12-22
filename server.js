/**
 * Created by Lynn on 2016/12/1 0001.
 */
var http=require('http'),
    url=require('url'),
    fs=require('fs'),
    mime=require('mime'),
    querystring=require('querystring');
/*新建文件替代数据库-将数据放到文件中
* 浏览器发送ajax请求，服务器读取文件，将文件返回给客户端*/
function getBooks(callback) {//读取数据
    fs.readFile('./book.json','utf8',function (err, data) {
        if(err||data==''){
            data='[]';
        }
        callback(JSON.parse(data));
    })
}
function setBooks(data,callback) {//写入数据
    fs.writeFile('./book.json',JSON.stringify(data),callback)
}

http.createServer(function (req, res) {
    var urlObj=url.parse(req.url,true),
        pathname=urlObj.pathname,
        query=urlObj.query;

    if(pathname=='/'){
        res.setHeader('content-type','text/html;charset=utf8;');
        fs.createReadStream('./index.html').pipe(res);
    }else if(/^\/books(\/\d+)?$/.test(pathname)){ // /book/1
        var id=/\/books(\/\d+)?/.exec(pathname)[1];
        switch (req.method){
            case 'GET':
                if(id){
                    var id =id.slice(1);
                    getBooks(function (data) {
                        // console.log(data);
                        var book=data.find(function (item) {
                            return item.id==id;
                        });
                        res.end(JSON.stringify(book));
                    })
                }else {
                    getBooks(function (data) {
                        // console.log(data);
                        res.end(JSON.stringify(data));
                    })
                }
                break;
            case 'POST':
                var str='';
                req.on('data',function (data) {
                    str+=data;
                });
                req.on('end',function () {
                    var book=JSON.parse(str);
                    getBooks(function (data) {
                        data.sort(function (a, b) {
                            return a.id-b.id;
                        });
                        book.id=data.length?parseInt(data[data.length-1].id)+1:1;
                        data.push(book);
                        setBooks(data,function () {
                            res.end(JSON.stringify(book));//返回增加一那一项
                        })
                    })
                });
                break;
            case 'PUT':
                if(id){
                    id=id.slice(1);
                    var str='';
                    req.on('data',function (data) {
                        str+=data;
                    });
                    req.on('end',function () {
                        var book=JSON.parse(str);
                        getBooks(function (data) {
                            data=data.map(function (item) {
                                if(item.id==id){
                                    // console.log(book)
                                    return book;
                                }
                                return item;
                            });
                            setBooks(data,function () {
                                res.end(JSON.stringify(book));
                            })
                        })
                    })
                }
                break;
            case 'DELETE':
                if(id){
                    id=id.slice(1);
                    getBooks(function (data) {
                        data=data.filter(function (item) {
                            return item.id != id;
                        });
                        setBooks(data,function () {
                            res.end(JSON.stringify({}));
                        })
                    })
                }
                break;
        }
    }else {
        fs.exists('.'+pathname,function (exists) {
            if(exists){
                res.setHeader('content-type',mime.lookup(pathname)+';charset=utf8;');
                fs.createReadStream('.'+pathname).pipe(res);
            }else {
                res.statusCode = 404;
                res.end('');
            }
        });

    }

}).listen('8080',function () {
    console.log('8080 ok!')
});

