const {logger} = require("../../../config/winston");
const {pool} = require("../../../config/database");
const secret_config = require("../../../config/secret");
const userProvider = require("./userProvider");
const userDao = require("./userDao");
const baseResponse = require("../../../config/baseResponseStatus");
const {response} = require("../../../config/response");
const {errResponse} = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {connect} = require("http2");

// Service: Create, Update, Delete 비즈니스 로직 처리

exports.createUser = async function (name, phoneNumber, email, password, IsAcceptedPrivacyTerm, IsAcceptedMarketingTerm) {
    try {
        //TODO 이메일체크 함수를 telCheck

        // 이메일 중복 확인
        const emailRows = await userProvider.emailCheck(email);
        if (emailRows.length > 0)
            return errResponse(baseResponse.SIGNUP_REDUNDANT_EMAIL);

        // 비밀번호 암호화
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const insertUserInfoParams = [name, phoneNumber, email, password, IsAcceptedPrivacyTerm, IsAcceptedMarketingTerm];

        // TODO transaction 적용해야함.
        const connection = await pool.getConnection(async (conn) => conn);
        console.log('test1');

        const userIdResult = await userDao.insertUserInfo(connection, insertUserInfoParams);
        const userId=userIdResult[0].insertId;
        //console.log(`추가된 회원 : ${userId}`)
        const getJobGroupRows=await userDao.getJobGroupCategories(connection)
        console.log(getJobGroupRows);
        const result={};
        result.userId=userId;
        result.jobGroup=getJobGroupRows;
        connection.release();
        return response(baseResponse.SUCCESS,result);


    } catch (err) {
        logger.error(`App - createUser Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


// TODO: After 로그인 인증 방법 (JWT)
exports.postSignIn = async function (email, password) {
    try {
        // 이메일 여부 확인
        const emailRows = await userProvider.emailCheck(email);
        if (emailRows.length < 1) return errResponse(baseResponse.SIGNIN_EMAIL_WRONG);

        const selectEmail = emailRows[0].email

        // 비밀번호 확인
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const selectUserPasswordParams = [selectEmail, hashedPassword];
        const passwordRows = await userProvider.passwordCheck(selectUserPasswordParams);

        if (passwordRows[0].password !== hashedPassword) {
            return errResponse(baseResponse.SIGNIN_PASSWORD_WRONG);
        }

        // 계정 상태 확인
        const userInfoRows = await userProvider.accountCheck(email);

        if (userInfoRows[0].status === "INACTIVE") {
            return errResponse(baseResponse.SIGNIN_INACTIVE_ACCOUNT);
        } else if (userInfoRows[0].status === "DELETED") {
            return errResponse(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT);
        }

        console.log(userInfoRows[0].id) // DB의 userId

        //토큰 생성 Service
        let token = await jwt.sign(
            {
                userId: userInfoRows[0].id,
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀키
            {
                expiresIn: "365d",
                subject: "userInfo",
            } // 유효 기간 365일
        );

        return response(baseResponse.SUCCESS, {'userId': userInfoRows[0].id, 'jwt': token});

    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};

exports.editUser = async function (id, nickname) {
    try {
        console.log(id)
        const connection = await pool.getConnection(async (conn) => conn);
        const editUserResult = await userDao.updateUserInfo(connection, id, nickname)
        connection.release();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        logger.error(`App - editUser Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.postJobCatgory=async function(userId,JobGroup,Job,career,skills){   //TODO JobGroup,Job이 name이 아니라 id여야 함.
    if(JobGroup!="개발"&&skills===null){
        return errResponse(baseResponse.NOT_DEVELOPMENT_CANT_HAVE_SKILL);
    }
    // TODO : JobGroup 과 Job이 부모-자식 관계여야함. check 함수가 추가로 구현되어야함.
    try{
        const connection = await pool.getConnection(async (conn) => conn);
        
        const insertProfileResult = await userDao.insertProfileInfo(connection,userId,JobGroup,Job,career,skills);// TODO profileId,JobGroupId 받아와야함.
        const insertJobCatgoryResult=await userDao.insertJobCategoryInfo(connection,profileId,categoryId); //
        const insertUserSkill=await userDao.insertUserSkills(connection,skills);
        connection.release();

        return response(baseResponse.SUCCESS);
    }catch(err){
        logger.error(`App - Post Job and JobGroup Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.postSchoolAndCompany=async function(name, company){
    try{
        const connection = await pool.getConnection(async (conn) => conn);
        const postJobCategoryResult = await userDao.postJobCatgory(connection,userId,JobGroup,Job,career,skills);
        connection.release();

        return response(baseResponse.SUCCESS);
    } catch(err){
        logger.error(`App - Post Job and JobGroup Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}
