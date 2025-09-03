import '../styles/ProfileBlock.css'

const ProfileBlock = () => {
    return (
        <div className="profile">
            <div className='avatar'>
                <img src='src/images/Pirate.jpg'/>
            </div>
            <div className='name'>
                Black Beard
            </div>
        </div>
    );
}

export default ProfileBlock;