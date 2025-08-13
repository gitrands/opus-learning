import dotenv from 'dotenv';
import * as dynamoose from 'dynamoose';
import Course from '../models/courseModel';
import UserCourseProgress from '../models/userCourseProgressModel';
import { v4 as uuid } from 'uuid';

dotenv.config();

// Config local vs prod
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  dynamoose.aws.ddb.local();
}

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@example.com';
const DEMO_USER_ID = process.env.DEMO_USER_ID; // You must set this to the Clerk user.id in .env

if (!DEMO_USER_ID) {
  console.error('Set DEMO_USER_ID in your .env to the real Clerk user ID.');
  process.exit(1);
}

async function main() {
  // Pick first 2 published courses
  const courses = await Course.scan('status').eq('Published').limit(2).exec();
  if (!courses || courses.length === 0) {
    console.log('No published courses found to enroll demo user.');
    return;
  }

  for (const course of courses) {
    const already = (course.enrollments || []).some((e: any) => e.userId === DEMO_USER_ID);
    if (!already) {
      course.enrollments = [...(course.enrollments || []), { userId: DEMO_USER_ID }];
      await course.save();
      console.log(`Enrolled demo user in course ${course.courseId}`);
    } else {
      console.log(`Demo user already enrolled in course ${course.courseId}`);
    }

    // Initialize minimal progress if not exists
  const existingProgress = await UserCourseProgress.get({ userId: DEMO_USER_ID as string, courseId: course.courseId }).catch(()=>null);
    if (!existingProgress) {
      const firstSection = course.sections?.[0];
      const firstChapter = firstSection?.chapters?.[0];
      const progress = new UserCourseProgress({
        userId: DEMO_USER_ID,
        courseId: course.courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        sections: firstSection && firstChapter ? [
          { sectionId: firstSection.sectionId, chapters: [{ chapterId: firstChapter.chapterId, completed: false }] }
        ] : [],
        lastAccessedTimestamp: new Date().toISOString()
      });
      await progress.save();
      console.log(`Initialized progress for ${course.courseId}`);
    } else {
      console.log(`Progress already exists for course ${course.courseId}`);
    }
  }
  console.log('Done.');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
