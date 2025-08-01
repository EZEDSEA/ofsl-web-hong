import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { getDayName, formatLeagueDates, getPrimaryLocation, type League } from '../../../lib/leagues';
import { RegistrationSuccessModal } from './RegistrationSuccessModal';

interface Skill {
  id: number;
  name: string;
  description: string | null;
}

interface TeamRegistrationModalProps {
  showModal: boolean;
  closeModal: () => void;
  leagueId: number;
  leagueName: string;
  league?: Partial<League>; // Use the League type from lib/leagues.ts
  isWaitlist?: boolean; // Add prop to indicate if this is a waitlist registration
}

export function TeamRegistrationModal({ 
  showModal, 
  closeModal, 
  leagueId, 
  leagueName,
  league,
  isWaitlist = false
}: TeamRegistrationModalProps) {
  const [teamName, setTeamName] = useState('');
  const [skillLevelId, setSkillLevelId] = useState<number | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const { userProfile, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Registration success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredTeamName, setRegisteredTeamName] = useState('');

  // Calculate HST (13%) and total amount
  const baseAmount = league?.cost || 0;
  const hstAmount = baseAmount * 0.13;
  const totalAmount = baseAmount + hstAmount;

  useEffect(() => {
    if (showModal) {
      loadSkills();
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const loadSkills = async () => {
    try {
      setSkillsLoading(true);
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error loading skills:', error);
      showToast('Failed to load skill levels', 'error');
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Reset error state
    setError(null);
    
    // For waitlist registrations, we only need skill level (not team name)
    if (!isWaitlist) {
      if (!teamName.trim()) {
        showToast('Please enter a team name', 'error');
        return;
      }
    }

    // Skill level is required for both regular and waitlist registrations
    if (!skillLevelId) {
      showToast('Please select a skill level', 'error');
      return;
    }

    // Check if the selected skill level is "Beginner"
    const selectedSkill = skills.find(skill => skill.id === skillLevelId);
    if (selectedSkill && selectedSkill.name === 'Beginner') {
      setError(
        "Thank you for your interest!\n" +
        "We appreciate your enthusiasm for joining our volleyball league. At this time, " +
        "our programs are designed for intermediate to elite level players with advanced " +
        "skills and a strong understanding of the game. Unfortunately, we're not able " +
        "to accept beginner level registrations."
      );
      return;
    }

    if (!userProfile) {
      showToast('User profile not found', 'error');
      return;
    }

    setLoading(true);

    try {
      // Get league information for payment calculation
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('cost')
        .eq('id', leagueId)
        .single();

      if (leagueError) throw leagueError;

      // Get the highest display_order for this league to add new team at the end
      const { data: maxOrderData } = await supabase
        .from('teams')
        .select('display_order')
        .eq('league_id', leagueId)
        .eq('active', !isWaitlist) // Same section (active or waitlist)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

      // Create the team
      const teamInsertData: {
        name: string;
        league_id: number;
        captain_id: string;
        roster: string[];
        active?: boolean;
        display_order?: number;
        skill_level_id?: number;
      } = {
        name: isWaitlist ? `Waitlist - ${userProfile.name || 'Team'}` : teamName.trim(),
        league_id: leagueId,
        captain_id: userProfile.id,
        roster: [userProfile.id], // Captain is automatically added to roster
        active: !isWaitlist, // Set inactive for waitlist teams
        display_order: nextDisplayOrder,
      };

      // Add skill_level_id for both regular and waitlist registrations
      if (skillLevelId) {
        teamInsertData.skill_level_id = skillLevelId;
      }

      // Try to add is_waitlisted field if the schema supports it
      // Note: We'll use the active field to distinguish waitlist teams (active=false)
      // and can add a separate waitlist tracking table if needed later

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert(teamInsertData)
        .select()
        .single();

      if (teamError) throw teamError;

      // Update user's team_ids array
      const currentTeamIds = userProfile.team_ids || [];
      const updatedTeamIds = [...currentTeamIds, teamData.id];

      const { error: userError } = await supabase
        .from('users')
        .update({ team_ids: updatedTeamIds })
        .eq('id', userProfile.id);

      if (userError) throw userError;

      // Send registration confirmation email
      try {
        if (user?.email) {
          const response = await supabase.functions.invoke('send-registration-confirmation', {
            body: {
              email: user.email,
              userName: userProfile.name || 'Team Captain',
              teamName: isWaitlist ? `Waitlist - ${userProfile.name || 'Team'}` : teamName.trim(),
              leagueName: leagueName,
              isWaitlist: isWaitlist
            }
          });

          if (response.error) {
            console.error('Failed to send confirmation email:', response.error);
            // Don't throw error - email failure shouldn't block registration
          }
        } else {
          console.error('No email found for user');
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue with registration flow even if email fails
      }

      // Trigger notification processing for new team registrations (not waitlist)
      if (!isWaitlist) {
        try {
          // Get current session for authorization
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Call the notification queue processor
            fetch('https://api.ofsl.ca/functions/v1/process-notification-queue', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
            }).catch(error => {
              // Don't block the user flow for notification errors
              console.error('Error triggering notification processing:', error);
            });
          }
        } catch (error) {
          // Don't block the user flow for notification errors
          console.error('Error triggering notification processing:', error);
        }
      }

      // Payment record will be automatically created by database trigger for regular registrations
      if (isWaitlist) {
        // For waitlist, show a simple success message and close
        showToast(`You've been added to the waitlist for ${leagueName}. We'll contact you if a spot opens up!`, 'success');
        closeModal();
      } else {
        // For regular registrations, show the full success modal
        if (leagueData?.cost && leagueData.cost > 0) {
          setRegisteredTeamName(teamName);
          setShowSuccessModal(true);
        } else {
          setRegisteredTeamName(teamName);
          setShowSuccessModal(true);
        }
        closeModal();
      }

    } catch (error) {
      console.error('Error registering team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register team';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTeamName('');
    setSkillLevelId(null);
    setError(null);
    closeModal();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to My Teams tab with proper routing
    navigate('/my-account/teams');
  };

  if (!showModal && !showSuccessModal) return null;

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Error message */}
              {error && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#6F6F6F]">Unable to Register</h2>
                    <button 
                      onClick={handleClose}
                      className="text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-full p-2 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
                    {error.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleClose}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-[10px] px-6 py-2"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            
              {!error && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#6F6F6F]">
                      {isWaitlist ? "Join Waitlist" : "Register Team"}
                    </h2>
                    <button 
                      onClick={handleClose}
                      className="text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-full p-2 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-[#6F6F6F]">
                      <span className="font-medium">League:</span> {leagueName}
                    </p>
                    {league && (
                      <>
                        {league.day_of_week !== null && league.day_of_week !== undefined && (
                          <p className="text-sm text-[#6F6F6F] mt-1">
                            <span className="font-medium">Day:</span> {getDayName(league.day_of_week)}
                          </p>
                        )}
                        {league.gyms && league.gyms.length > 0 && (
                          <p className="text-sm text-[#6F6F6F] mt-1">
                            <span className="font-medium">School:</span> {getPrimaryLocation(league.gyms).join(', ')}
                          </p>
                        )}
                        {(league.start_date || league.end_date) && (
                          <p className="text-sm text-[#6F6F6F] mt-1">
                            <span className="font-medium">Season:</span> {formatLeagueDates(league.start_date || null, league.end_date || null, league.hide_day || false)}
                          </p>
                        )}
                        {league.cost && (
                          <p className="text-sm text-[#6F6F6F] mt-1">
                            <span className="font-medium">Cost:</span> ${totalAmount.toFixed(2)} (${baseAmount.toFixed(2)} + ${hstAmount.toFixed(2)} HST)
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-sm text-[#6F6F6F] mt-1">
                      <span className="font-medium">Captain:</span> {userProfile?.name || 'Current User'}
                    </p>
                  </div>

                  {isWaitlist ? (
                    // Waitlist-specific content
                    <>
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 mb-6">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-amber-800 font-medium mb-2">League&apos;s Full (For Now!)</p>
                          <p className="text-sm text-amber-700">
                            Thanks for your interest—we love the enthusiasm. The league&apos;s currently full, but sometimes people bail (life happens) and spots open up. Want us to add you to the waitlist? No promises, but we&apos;ll reach out if a spot frees up.
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-[#6F6F6F] mb-2">
                          Team Skill Level *
                        </label>
                        {skillsLoading ? (
                          <div className="text-sm text-[#6F6F6F]">Loading skill levels...</div>
                        ) : (
                          <select
                            value={skillLevelId || ''}
                            onChange={(e) => setSkillLevelId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B20000] focus:ring-[#B20000]"
                            required
                          >
                            <option value="">Select skill level...</option>
                            {skills.map(skill => (
                              <option 
                                key={skill.id} 
                                value={skill.id} 
                              >
                                {skill.name}
                                {skill.description && ` - ${skill.description}`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <Button
                          onClick={handleSubmit}
                          disabled={loading || skillsLoading}
                          className="flex-1 border-[#B20000] bg-white hover:bg-[#B20000] text-[#B20000] hover:text-white rounded-[10px] px-6 py-2"
                        >
                          {loading ? 'Joining...' : 'Yes, join waitlist'}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleClose}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white rounded-[10px] px-6 py-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Normal registration form
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#6F6F6F] mb-2">
                          Team Name *
                        </label>
                        <Input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Enter your team name"
                          className="w-full"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#6F6F6F] mb-2">
                          Team Skill Level *
                        </label>
                        {skillsLoading ? (
                          <div className="text-sm text-[#6F6F6F]">Loading skill levels...</div>
                        ) : (
                          <select
                            value={skillLevelId || ''}
                            onChange={(e) => setSkillLevelId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B20000] focus:ring-[#B20000]"
                            required
                          >
                            <option value="">Select skill level...</option>
                            {skills.map(skill => (
                              <option 
                                key={skill.id} 
                                value={skill.id} 
                              >
                                {skill.name}
                                {skill.description && ` - ${skill.description}`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {league && league.cost && league.cost > 0 && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-800 font-medium">Registration Information</p>
                            <p className="text-sm text-amber-700 mt-1">
                              To secure your spot in this league, a deposit of $200 or full payment of ${totalAmount.toFixed(2)} (${baseAmount.toFixed(2)} + ${hstAmount.toFixed(2)} HST) will be required after registration.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> You will be automatically added as the team captain and first player. 
                          After registration, you can add more players to your team from the &ldquo;My Teams&rdquo; page.
                          Registration fees will be tracked and due within 30 days.
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="submit"
                          disabled={loading || skillsLoading}
                          className="flex-1 border-[#B20000] bg-white hover:bg-[#B20000] text-[#B20000] hover:text-white rounded-[10px] px-6 py-2"
                        >
                          {loading ? 'Registering...' : 'Register Team'}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleClose}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white rounded-[10px] px-6 py-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      <RegistrationSuccessModal
        showModal={showSuccessModal}
        closeModal={handleSuccessModalClose}
        teamName={registeredTeamName}
        leagueName={leagueName}
        leagueCost={league?.cost || null}
      />
    </>
  );
}