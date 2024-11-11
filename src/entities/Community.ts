import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import DefaultEntity from './Entity';
import Post from './Post';
import User from './User';
import { Expose } from 'class-transformer';

@Entity('communities')
export default class Community extends DefaultEntity {
  @Index()
  @Column({ unique: true })
  name: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column()
  username: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @OneToMany(() => Post, (post) => post.community)
  posts: Post[];

  @Expose()
  get imageUrn(): string {
    return this.imageUrl
      ? `${process.env.APP_URL}/images/${this.imageUrl}`
      : 'https://www.gravatar.com/avatar?d=mp&f=y';
  }

  @Expose()
  get bannerUrn(): string | undefined {
    return this.bannerUrl
      ? `${process.env.APP_URL}/images/${this.bannerUrl}`
      : undefined;
  }
}
