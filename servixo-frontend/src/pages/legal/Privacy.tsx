import { Link } from "react-router-dom";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
                <Link to="/" className="text-sm text-accent hover:underline mb-6 inline-block">
                    ← Back to home
                </Link>
                <h1 className="text-2xl font-semibold text-navy mb-6">Privacy Policy</h1>

                <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
                    <p>This policy explains what information Servixo collects and how it's used.</p>

                    <div>
                        <h2 className="text-navy font-semibold mb-1">1. Information we collect</h2>
                        <p>
                            Name, email, phone number, and password (encrypted) when you register. For workers,
                            we also collect skills, service area, and pricing. For job requests, we collect a
                            description, photos, and location.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-navy font-semibold mb-1">2. How we use it</h2>
                        <p>
                            To match customers with nearby workers, verify your account by email, process job
                            requests, and communicate important updates about your account.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-navy font-semibold mb-1">3. Sharing</h2>
                        <p>
                            We don't sell your personal data. Limited information (like name and general
                            location) is shared between a customer and worker only once a job is being
                            arranged.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-navy font-semibold mb-1">4. Your control</h2>
                        <p>
                            You can update your profile information at any time, and request account deletion
                            by contacting support.
                        </p>
                    </div>

                    <p className="text-gray-400 text-xs pt-4 border-t border-gray-100">
                        This is placeholder text for demonstration purposes and should be replaced with a real
                        privacy policy before public launch.
                    </p>
                </div>
            </div>
        </div>
    );
}