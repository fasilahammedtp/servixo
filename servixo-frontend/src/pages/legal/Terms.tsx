import { Link } from "react-router-dom";

export default function Terms() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B1513] py-12 px-4 transition-colors duration-300">
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#132320] rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                <Link to="/" className="text-sm text-accent hover:underline mb-6 inline-block">
                    ← Back to home
                </Link>
                <h1 className="text-2xl font-semibold text-navy dark:text-white mb-6">Terms &amp; Conditions</h1>

                <div className="space-y-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    <p>
                        Welcome to Servixo. By creating an account or using this platform, you agree to the
                        following terms.
                    </p>

                    <div>
                        <h2 className="text-navy dark:text-white font-semibold mb-1">1. Using the platform</h2>
                        <p>
                            Servixo connects customers with independent service professionals. We do not employ
                            workers directly and are not a party to any agreement made between a customer and a
                            worker.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-navy dark:text-white font-semibold mb-1">2. Accounts</h2>
                        <p>
                            You're responsible for keeping your account credentials secure and for all activity
                            under your account. Please notify us if you suspect unauthorized access.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-navy dark:text-white font-semibold mb-1">3. Worker verification</h2>
                        <p>
                            Workers are reviewed before their profile is marked verified, but Servixo does not
                            guarantee the quality, safety, or legality of services provided by any worker on the
                            platform.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-navy dark:text-white font-semibold mb-1">4. Changes</h2>
                        <p>
                            These terms may be updated from time to time. Continued use of the platform after a
                            change means you accept the updated terms.
                        </p>
                    </div>

                    <p className="text-gray-400 dark:text-gray-500 text-xs pt-4 border-t border-gray-100 dark:border-gray-800">
                        This is placeholder text for demonstration purposes and should be replaced with real
                        legal terms before public launch.
                    </p>
                </div>
            </div>
        </div>
    );
}