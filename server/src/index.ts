import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import serverless from "serverless-http";
import seed from "./seed/seedDynamodb";
import {
  clerkMiddleware,
  createClerkClient,
  requireAuth,
} from "@clerk/express";
/* ROUTE IMPORTS */
import courseRoutes from "./routes/courseRoutes";
import userClerkRoutes from "./routes/userClerkRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import userCourseProgressRoutes from "./routes/userCourseProgressRoutes";
import Course from "./models/courseModel";
import UserCourseProgress from "./models/userCourseProgressModel";

/* CONFIGURATIONS */
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  dynamoose.aws.ddb.local();
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(clerkMiddleware());

/* ROUTES */
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/courses", courseRoutes);
app.use("/users/clerk", requireAuth(), userClerkRoutes);
app.use("/transactions", requireAuth(), transactionRoutes);
app.use("/users/course-progress", requireAuth(), userCourseProgressRoutes);

/* SERVER */
const port = process.env.PORT || 3000;
if (!isProduction) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Auto-enroll demo user if DEMO_USER_EMAIL is set
    void (async () => {
      try {
        const demoEmail = process.env.DEMO_USER_EMAIL;
        if (!demoEmail) return; // nothing to do
        console.log("[demo-enroll] DEMO_USER_EMAIL detected, attempting auto-enroll...");
  const users = await clerkClient.users.getUserList({ emailAddress: [demoEmail] });
  if (!users || !Array.isArray(users.data) || users.data.length === 0) {
          console.log(`[demo-enroll] No Clerk user found for email ${demoEmail}.`);
          return;
        }
  const demoUserId = users.data[0].id;
        const publishedCourses = await Course.scan("status").eq("Published").limit(2).exec();
        for (const course of publishedCourses) {
          const already = (course.enrollments || []).some((e: any) => e.userId === demoUserId);
            if (!already) {
            course.enrollments = [...(course.enrollments || []), { userId: demoUserId }];
            await course.save();
            console.log(`[demo-enroll] Enrolled demo user in course ${course.courseId}`);
          } else {
            console.log(`[demo-enroll] Already enrolled in course ${course.courseId}`);
          }
          // Progress
          const existingProgress = await UserCourseProgress.get({ userId: demoUserId, courseId: course.courseId }).catch(() => null);
          if (!existingProgress) {
            const firstSection = course.sections?.[0];
            const firstChapter = firstSection?.chapters?.[0];
            const progress = new UserCourseProgress({
              userId: demoUserId,
              courseId: course.courseId,
              enrollmentDate: new Date().toISOString(),
              overallProgress: 0,
              sections: firstSection && firstChapter ? [
                { sectionId: firstSection.sectionId, chapters: [{ chapterId: firstChapter.chapterId, completed: false }] }
              ] : [],
              lastAccessedTimestamp: new Date().toISOString(),
            });
            await progress.save();
            console.log(`[demo-enroll] Initialized progress for course ${course.courseId}`);
          }
        }
        console.log("[demo-enroll] Completed.");
      } catch (err) {
        console.error("[demo-enroll] Failed:", err);
      }
    })();
  });
}

// aws production environment
const serverlessApp = serverless(app);
export const handler = async (event: any, context: any) => {
  if (event.action === "seed") {
    await seed();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data seeded successfully" }),
    };
  } else {
    return serverlessApp(event, context);
  }
};
