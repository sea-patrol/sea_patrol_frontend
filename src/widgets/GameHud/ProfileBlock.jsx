import { useAuth } from '@/features/auth/model/AuthContext';
import pirateAvatar from '@/shared/assets/Pirate.jpg';
import './ProfileBlock.css';

const ProfileBlock = () => {
  const { user } = useAuth();

  return (
    <div className="profile">
      <div className="avatar">
        <img src={pirateAvatar} alt="Аватар игрока" />
      </div>
      <div className="meta">
        <div className="eyebrow">Captain</div>
        <div className="name">{user?.username ?? 'Guest Captain'}</div>
      </div>
    </div>
  );
};

export default ProfileBlock;
