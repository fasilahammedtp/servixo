import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { updateWorkerProfile } from "../../services/workerService";

const AVAILABLE_SKILLS = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Cleaning",
  "AC Repair",
  "Appliance Repair",
];

export default function WorkerProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [skills, setSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(10);
  const [visitingCharge, setVisitingCharge] = useState<number | "">("");
  const [errorMessage, setErrorMessage] = useState("");

  const mutation = useMutation({
    mutationFn: (data: {
      userId: string;
      skills: string[];
      experienceYears: number;
      serviceRadiusKm: number;
      visitingCharge: number;
    }) => updateWorkerProfile(data.userId, {
      skills: data.skills,
      experienceYears: data.experienceYears,
      serviceRadiusKm: data.serviceRadiusKm,
      visitingCharge: data.visitingCharge,
    }),
    onSuccess: () => {
      navigate("/worker");
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || "Failed to update profile. Please try again.");
    },
  });

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (skills.length === 0) {
      setErrorMessage("Please select at least one skill.");
      return;
    }

    if (experienceYears === "" || visitingCharge === "") {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    if (!user?.id) {
      setErrorMessage("User not found. Please log in again.");
      return;
    }

    mutation.mutate({
      userId: user.id,
      skills,
      experienceYears: Number(experienceYears),
      serviceRadiusKm,
      visitingCharge: Number(visitingCharge),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-semibold text-navy text-center mb-1">Complete your profile</h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          Add your skills, service area, and pricing
        </p>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">Your Skills</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition border ${
                      isSelected
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-gray-600 border-gray-200 hover:border-accent hover:text-accent"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm text-gray-600 mb-1 font-medium">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="50"
              required
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. 5"
            />
          </div>

          {/* Service Radius */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600 font-medium">Service Radius</label>
              <span className="text-sm text-navy font-medium">{serviceRadiusKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Visiting Charge */}
          <div>
            <label className="block text-sm text-gray-600 mb-1 font-medium">Visiting Charge (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                type="number"
                min="0"
                required
                value={visitingCharge}
                onChange={(e) => setVisitingCharge(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g. 200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-navy text-white rounded-lg py-2.5 font-medium hover:bg-navy/90 transition disabled:opacity-60"
          >
            {mutation.isPending ? "Saving..." : "Save Profile & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}