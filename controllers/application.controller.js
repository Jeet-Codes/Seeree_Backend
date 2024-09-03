import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/emailService.js";// Adjust path as necessary
export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            });
        }

        // Check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this job",
                success: false
            });
        }

        // Check if the job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Create a new application
        const newApplication = await Application.create({
            job: jobId,
            applicant: userId,
        });

        job.applications.push(newApplication._id);
        await job.save();

        // Fetch user details for email
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Send email
        const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: auto;
                    background: #fff;
                    border-radius: 8px;
                    overflow: hidden;
                    padding: 20px;
                }
                .header {
                    background: #0044cc;
                    padding: 10px 20px;
                    color: #fff;
                    text-align: center;
                }
                .header img {
                    max-width: 150px;
                    height: auto;
                }
                .content {
                    padding: 20px;
                }
                .footer {
                    background: #f1f1f1;
                    padding: 10px 20px;
                    text-align: center;
                    color: #555;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpRCm2AYFiwZ7jC2527hkvBTmu8b2wX_OXfQ&s" alt="Company Logo" />
                </div>
                <div class="content">
                    <h1>Application Received</h1>
                    <p>Hello ${user.fullname},</p>
                    <p>Thank you for applying for the position of <strong>${job.title}</strong> at <strong>${job.company.name}</strong>. We have received your application and will review it shortly.</p>
                    <p>Best regards,<br>The Seeree Team</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Seeree. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
        await sendEmail(user.email, 'Job Application Confirmation', emailContent);

        return res.status(201).json({
            message: "Job applied successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            succees:true
        });
    } catch (error) {
        console.log(error);
    }
}
export const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId});
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        // update the status
        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
    }
}
export const deleteApplicant=async (req, res) => {
    try {
        const applicantId = req.params.id;
        const application = await Application.findByIdAndDelete(applicantId);
        if (!application) {
            return res.status(404).json({ message: "Applicant not found", success: false });
        }
        res.status(200).json({ message: "Applicant deleted successfully", success: true });
    } catch (error) {
        console.error("Error deleting applicant:", error);
        res.status(500).json({ message: "Internal server error", success: false });
    }
}