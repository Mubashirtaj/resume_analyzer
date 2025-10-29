import axios from "axios";
import { ENV } from "../config/env";

const API_URL = "https://jsearch.p.rapidapi.com/search";
const RAPID_API_KEY = ENV.RAPID_API_KEY!;
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function fetchJobs(
  field: string,
  country?: string,
  pageN: string = "1"
) {
  const query = country ? `${field} in ${country}` : field; // ✅ combine both

  const options = {
    method: "GET",
    url: API_URL,
    params: {
      query,
      page: pageN,
      num_pages: pageN,
    },
    headers: {
      "x-rapidapi-key": RAPID_API_KEY,
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
    },
  };

  const { data } = await axios.request(options);

  return data.data.map((job: any) => ({
    title: job.job_title,
    company: job.employer_name,
    location: `${job.job_city || ""}, ${job.job_country || ""}`.trim(),
    link: job.job_apply_link,
    posted: formatDate(job.job_posted_at_datetime_utc),
    type: job.job_employment_type,
    salary: job.job_min_salary
      ? `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency}`
      : "Not specified",
    experience:
      job.job_required_experience?.experience_level || "Not specified",
    highlights: job.job_highlights?.Qualifications || [],
    description: job.job_description,
    source: job.job_publisher,
  }));
}
