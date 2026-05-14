import styles from "./UserAvatar.module.scss";

export type UserAvatarProperties = {
  profileImageUrl: string;
  displayName: string;
};

export function UserAvatar({ profileImageUrl, displayName }: UserAvatarProperties) {
  return (
    <img
      className={styles.userAvatar}
      src={profileImageUrl}
      alt={`${displayName} profile`}
      loading="lazy"
      decoding="async"
    />
  );
}
