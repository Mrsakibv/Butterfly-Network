import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { CreatePost } from '../components/social/CreatePost';
import { SocialFeed } from '../components/social/SocialFeed';
import { useAuth } from '../hooks/useAuth';
import { useSocialPermission } from '../hooks/useSocialPermission';
import { useRouter } from '../hooks/useRouter';
import { Users } from 'lucide-react';

interface SocialPageProps {
  onOpenPlayModal: () => void;
}

export const SocialPage: React.FC<SocialPageProps> = ({ onOpenPlayModal }) => {
  const { user } = useAuth();
  const { canPost } = useSocialPermission();
  const { navigate } = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
      <Navbar onOpenPlayModal={onOpenPlayModal} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
                Social Feed
              </h1>
              <p className="text-slate-400 text-sm">
                Connect with the Butterfly Network community
              </p>
            </div>
          </div>

          {!user && (
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4 mt-4">
              <p className="text-purple-300 text-sm">
                <button
                  onClick={() => navigate('/login')}
                  className="font-semibold hover:text-purple-200 transition-colors underline cursor-pointer"
                >
                  Log in
                </button>
                {' '}to view all posts and interact with the community
              </p>
            </div>
          )}

          {user && !canPost && (
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 mt-4">
              <p className="text-blue-300 text-sm">
                You can view and interact with posts. Contact an admin for posting permissions.
              </p>
            </div>
          )}
        </div>

        {/* Create Post (only for users with permission) */}
        {user && canPost && (
          <CreatePost onPostCreated={handlePostCreated} />
        )}

        {/* Feed */}
        <SocialFeed refresh={refreshKey} />
      </main>
    </div>
  );
};
