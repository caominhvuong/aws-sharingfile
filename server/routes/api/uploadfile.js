const AWS = require('aws-sdk');
const Busboy = require('busboy');

// Setup AWS SDK
const s3bucket = new AWS.S3({
	accessKeyId: process.env.IAM_USER_KEY,
	secretAccessKey: process.env.IAM_USER_SECRET,
	Bucket: process.env.BUCKET_NAME,
});

// Upload file lên AWS
function uploadToS3(file, onUploadDone) {
	s3bucket.createBucket(function () {
		var params = {
			Bucket: process.env.BUCKET_NAME,
			Key: file.name,
			Body: file.data,
			ACL: process.env.FILE_PERMISSION
		};
		s3bucket.upload(params, function (err, data) {
			if (err) {
				console.log('error in callback');
				console.log(err);
				onUploadDone(err);
			}
			console.log('success');
			console.log('Upload finished');
			onUploadDone(null, data);
		});
	});
}

module.exports = (app) => {
	// Router nhận file từ client
	app.post('/api/upload', function (req, res, next) {
		var busboy = new Busboy({ headers: req.headers });
		busboy.on('finish', function () {
			const file = req.files.file;
			uploadToS3(file, (err, file) => {
				if(err) res.status(500).json(err)
				else res.json(file.Location);
			});
		});
		req.pipe(busboy);
	});
}