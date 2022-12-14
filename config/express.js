const express = require('express');
const compression = require('compression');
const methodOverride = require('method-override');
var cors = require('cors');
module.exports = function () {
    const app = express();

    app.use(compression());

    app.use(express.json());

    app.use(express.urlencoded({extended: true}));

    app.use(methodOverride());

    app.use(cors());
    // app.use(express.static(process.cwd() + '/public'));

    /* App (Android, iOS) */
    // TODO: 도메인을 추가할 경우 이곳에 Route를 추가하세요.
    require('../src/app/User/userRoute')(app);
    require('../src/app/JobCategories/jobRoute')(app);
    require('../src/app/Post/postRoute')(app);
    require('../src/app/Skill/skillRoute')(app);
    require('../src/app/PostTag/postTagRoute')(app);
    require('../src/app/Resume/resumeRoute')(app);
    require('../src/app/Employment/employmentRoute')(app);
    require('../src/app/Company/companyRoute')(app);
    require('../src/app/School/schoolRoute')(app);
    require('../src/app/DummyData/router')(app);
    require('../src/app/Employee/employeeRoute')(app);
    require('../src/app/SENS/sensRoute')(app);
    // require('../src/app/Board/boardRoute')(app);
    require('../src/app/SENS - jeje/sens')(app);
    require("../src/app/File/fileRoute")(app);
    require("../src/app/multer-jeje/multer")(app);
    return app;
};