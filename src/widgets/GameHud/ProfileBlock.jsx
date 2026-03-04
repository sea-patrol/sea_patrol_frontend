import pirateAvatar from '@/shared/assets/Pirate.jpg';
import './ProfileBlock.css'

const ProfileBlock = () => {
    return (
        <div className="profile">
            <div className='avatar'>
                <img src={pirateAvatar} alt="Аватар игрока" />
            </div>
            <div className='name'>
                Black Beard
            </div>
        </div>
    );
}

export default ProfileBlock;
