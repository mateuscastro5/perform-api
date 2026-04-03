import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const normalizedEmail = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['squad', 'permissions'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['squad', 'permissions'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softRemove(user);
  }

  async updateProfile(userId: string, profileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);

    if (profileDto.email && profileDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: profileDto.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already exists');
      }
    }

    if (profileDto.avatarUrl !== undefined) {
      const trimmedAvatar = profileDto.avatarUrl.trim();

      if (!trimmedAvatar) {
        user.avatarUrl = null;
      } else {
        const isDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmedAvatar);
        const isHttpImage = /^https?:\/\//i.test(trimmedAvatar);

        if (!isDataImage && !isHttpImage) {
          throw new BadRequestException('Invalid avatar format. Use an image data URL or HTTP URL');
        }

        if (trimmedAvatar.length > 7_000_000) {
          throw new BadRequestException('Avatar image is too large');
        }

        user.avatarUrl = trimmedAvatar;
      }
    }

    if (profileDto.name !== undefined) {
      user.name = profileDto.name.trim();
    }

    if (profileDto.email !== undefined) {
      user.email = profileDto.email.trim().toLowerCase();
    }

    if (profileDto.githubUsername !== undefined) {
      const normalizedGithubUsername = profileDto.githubUsername.trim();
      user.githubUsername = normalizedGithubUsername || null;
    }

    return this.usersRepository.save(user);
  }
}
