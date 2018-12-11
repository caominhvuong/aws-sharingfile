import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      files: {},
      formData: {
        mailTo: "",
        mailBody: "",
        mailSubject: ""
      },
      uploadFiles: []
    };

    this.mounted = false;

    this.onDrop = this.onDrop.bind(this);
    this.onUploadProgress = this.onUploadProgress.bind(this);
    this.upload = this.upload.bind(this);
    this.submitMail = this.submitMail.bind(this);
  }
  
  componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount() {
		this.mounted = false;
	}

  onUploadProgress(progressEvent, fileName) {
    if (progressEvent && progressEvent.loaded && progressEvent.total) {
      const { files } = this.state;
      files[fileName].progress = Number(((progressEvent.loaded * 100) / progressEvent.total).toFixed(2));
      if (files[fileName].progress == 100) {
        files[fileName].status = "completed";
      }

      if (this.mounted) {
        this.setState({
          files: files
        });
      }
    }
  }

  upload(file) {
    // Upload file
		let formData = new FormData();
    formData.append("file", file);

    axios({
      url: "/api/upload",
      method: "POST",
      data: formData,
      onUploadProgress: (progressEvent) => this.onUploadProgress(progressEvent, file.name)
    }).then(response => {
      if (response.data) {
        if (this.mounted) {
          const { files, uploadFiles } = this.state;
          files[file.name].fileUrl = response.data;
          this.setState({
            uploadFiles: [ ...uploadFiles, response.data ],
            files
          });
        }
      }
    });

  }

  onDrop(acceptedFiles) {
    acceptedFiles.forEach(file => {
      if (!this.state.files[file.name]) {
        this.setState({ files: { ...this.state.files, [file.name]: { file, progress: 0, status: "waiting", fileUrl: "" } } });
        this.upload(file);
      }
    });
  }

  renderListUploader(files) {
    // Hiện list file upload
    return Object.keys(files).map((fileName, index) => {
      return (
        <div className="item" key={index}>
          <span>{files[fileName].file.name}</span>
          <div className="progress mt-2" style={{ height: "25px" }}>
            <div className="progress-bar bg-info" role="progressbar" style={{ width: `${files[fileName].progress}%` }} aria-valuenow={files[fileName].progress} aria-valuemin="0" aria-valuemax="100">{files[fileName].progress}%</div>
          </div>
          {files[fileName].fileUrl ? <div>
            Đường dẫn đến file: <a href={files[fileName].fileUrl} target="_blank">Xem</a>
          </div> : ""}
        </div>
      );
    });
  }

  submitMail(e) {
    // Mở tab gửi email
    e.preventDefault();
    const { formData, uploadFiles } = this.state;
    let listUrl = uploadFiles.join("\n");
    let mailBody = encodeURIComponent(`${formData.mailBody}\n${listUrl}`);
    window.open(`https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${formData.mailTo}&su=${formData.mailSubject}&body=${mailBody}&tf=1`, '_blank');
  }

  render() {
    const { files, formData, uploadFiles } = this.state;
    return (
      <div className="container">
        <div className="mt-5 card">
          <div className="card-header">
            Upload tool v1.0
          </div>
          <div className="card-body">
            <form onSubmit={this.submitMail}>
              <div className="form-group">
                <label>Email người nhận:</label>
                <input value={formData.mailTo} onChange={(e) => this.setState({ formData: { ...formData, mailTo: e.target.value } })} type="email" className="form-control" id="email" placeholder="name@example.com" required />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input value={formData.mailSubject} onChange={(e) => this.setState({ formData: { ...formData, mailSubject: e.target.value } })} type="text" className="form-control" id="subject" required />
              </div>
              <div className="form-group">
                <label>Nội dung:</label>
                <textarea value={formData.mailBody} onChange={(e) => this.setState({ formData: { ...formData, mailBody: e.target.value } })} type="text" className="form-control" id="content" required></textarea>
              </div>
              <div className="form-group dropUpload">
                <label>Upload file:</label>
                <Dropzone
                  onDrop={this.onDrop} required
                >
                  <strong>Kéo thả file hoặc click vào đây.</strong>
                </Dropzone>
              </div>
              <div className="form-group itemUpload">
                {files && Object.keys(files).length > 0 ? this.renderListUploader(files) : ""}
              </div>
              <input
                disabled={!formData.mailBody || !formData.mailSubject || !formData.mailTo || uploadFiles.length === 0 || uploadFiles.length !== Object.keys(files).length}
                className="btn btn-primary"
                type="submit"
                value="Gửi"
              />
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
