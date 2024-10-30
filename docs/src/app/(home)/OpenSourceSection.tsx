import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const OpenSourceSection = () => {
  return (
    <section className="bg-white dark:bg-gray-900 py-10">
      <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="mb-6 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            Why we <span className="text-red-500">❤</span> open source
          </h2>
          <p className="mb-3 text-base text-gray-500 sm:text-lg dark:text-gray-400">
            Flexible, scalable, no vendor lock-in, and no license cost.
          </p>
          <p className="mb-8 text-base text-gray-500 sm:text-lg dark:text-gray-400">
            Free community support and our core philosophy still remains - your data is your data. You have the power to switch to and fro open source and cloud version anytime, just ask for an export and you can setup and continue on your own.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <Link
              href="https://github.com/easystartup-io/suggest-feature"
              target="_blank"
            >
              <Button
                size="lg"
                variant="outline"
                className="py-3 px-5 text-base font-medium text-center rounded-lg border hover:bg-gray-900/10 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900"
              >
                Check our GitHub
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OpenSourceSection;
