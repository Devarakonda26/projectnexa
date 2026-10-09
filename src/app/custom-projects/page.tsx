import Link from "next/link";

export const metadata = { title: "Custom engineering projects" };

export default function CustomProjectsPage() {
  const steps = [
    ["Describe your project", "Tell us the idea, branch, budget range and deadline. Attach any reference files."],
    ["Get a quotation", "We review your request and send a fixed quote with scope and delivery time."],
    ["Approve and track", "Accept the quote, then follow milestones as each stage is delivered and approved."],
  ];
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Custom engineering projects</h1>
      <p className="mt-3 text-slate-700">Need something that is not in our catalogue? We design and build projects to your specification across CSE, IT, ECE, EEE, Mechanical, Civil, AI/Data Science and Robotics.</p>
      <ol className="mt-8 space-y-4">
        {steps.map(([title, body], i) => (
          <li key={title} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold">{i + 1}. {title}</p>
            <p className="text-sm text-slate-600">{body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/custom-projects/new" className="rounded-md bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800">Start a request</Link>
        <Link href="/custom-projects/requests" className="rounded-md border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-100">My requests</Link>
      </div>
    </main>
  );
}
