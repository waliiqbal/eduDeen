import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
    constructor(
        @InjectModel(Address.name)
        private addressModel: Model<AddressDocument>,
    ) { }

    // Create new address
    async create(userId: string, createAddressDto: CreateAddressDto) {
        try {
            // If this is set as default, unset other default addresses
            if (createAddressDto.isDefault) {
                await this.addressModel.updateMany(
                    { user: userId, isDefault: true },
                    { $set: { isDefault: false } },
                );
            }

            // If this is the first address, make it default automatically
            const existingCount = await this.addressModel
                .countDocuments({ user: userId })
                .exec();

            const isFirstAddress = existingCount === 0;

            const address = await this.addressModel.create({
                ...createAddressDto,
                user: userId,
                isDefault: createAddressDto.isDefault || isFirstAddress,
            });

            return {
                success: true,
                message: 'Address created successfully',
                data: address,
            };
        } catch (error) {
            throw new BadRequestException('Error creating address');
        }
    }

    // Get all addresses for a user
    async findAll(userId: string) {
        try {
            const addresses = await this.addressModel
                .find({ user: userId, isActive: true })
                .sort({ isDefault: -1, createdAt: -1 })
                .exec();

            return {
                success: true,
                count: addresses.length,
                data: addresses,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching addresses');
        }
    }

    // Get default address
    async getDefault(userId: string) {
        try {
            const address = await this.addressModel
                .findOne({ user: userId, isDefault: true, isActive: true })
                .exec();

            if (!address) {
                // If no default, return the first address
                const firstAddress = await this.addressModel
                    .findOne({ user: userId, isActive: true })
                    .sort({ createdAt: 1 })
                    .exec();

                if (firstAddress) {
                    // Make it default
                    firstAddress.isDefault = true;
                    await firstAddress.save();
                    return {
                        success: true,
                        data: firstAddress,
                    };
                }

                throw new NotFoundException('No addresses found');
            }

            return {
                success: true,
                data: address,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error fetching default address');
        }
    }

    // Get single address
    async findOne(addressId: string, userId: string) {
        try {
            const address = await this.addressModel
                .findOne({ _id: addressId, user: userId, isActive: true })
                .exec();

            if (!address) {
                throw new NotFoundException('Address not found');
            }

            return {
                success: true,
                data: address,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error fetching address');
        }
    }

    // Update address
    async update(
        addressId: string,
        userId: string,
        updateAddressDto: UpdateAddressDto,
    ) {
        try {
            const address = await this.addressModel
                .findOne({ _id: addressId, user: userId })
                .exec();

            if (!address) {
                throw new NotFoundException('Address not found');
            }

            // If setting as default, unset other defaults
            if (updateAddressDto.isDefault) {
                await this.addressModel.updateMany(
                    { user: userId, isDefault: true, _id: { $ne: addressId } },
                    { $set: { isDefault: false } },
                );
            }

            // Update the address
            Object.assign(address, updateAddressDto);
            await address.save();

            return {
                success: true,
                message: 'Address updated successfully',
                data: address,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error updating address');
        }
    }

    // Set address as default
    async setDefault(addressId: string, userId: string) {
        try {
            const address = await this.addressModel
                .findOne({ _id: addressId, user: userId })
                .exec();

            if (!address) {
                throw new NotFoundException('Address not found');
            }

            // Unset all other defaults
            await this.addressModel.updateMany(
                { user: userId, isDefault: true },
                { $set: { isDefault: false } },
            );

            // Set this as default
            address.isDefault = true;
            await address.save();

            return {
                success: true,
                message: 'Default address updated',
                data: address,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error setting default address');
        }
    }

    // Delete address (soft delete)
    async remove(addressId: string, userId: string) {
        try {
            const address = await this.addressModel
                .findOne({ _id: addressId, user: userId })
                .exec();

            if (!address) {
                throw new NotFoundException('Address not found');
            }

            // Check if it's the default address
            if (address.isDefault) {
                // Find another address to make default
                const otherAddress = await this.addressModel
                    .findOne({
                        user: userId,
                        _id: { $ne: addressId },
                        isActive: true
                    })
                    .sort({ createdAt: 1 })
                    .exec();

                if (otherAddress) {
                    otherAddress.isDefault = true;
                    await otherAddress.save();
                }
            }

            // Soft delete
            address.isActive = false;
            await address.save();

            return {
                success: true,
                message: 'Address deleted successfully',
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error deleting address');
        }
    }

    // Permanent delete
    async permanentDelete(addressId: string, userId: string) {
        try {
            const result = await this.addressModel
                .deleteOne({ _id: addressId, user: userId })
                .exec();

            if (result.deletedCount === 0) {
                throw new NotFoundException('Address not found');
            }

            return {
                success: true,
                message: 'Address permanently deleted',
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error deleting address');
        }
    }

    // Get address count for a user
    async getCount(userId: string) {
        try {
            const count = await this.addressModel
                .countDocuments({ user: userId, isActive: true })
                .exec();

            return {
                success: true,
                count,
            };
        } catch (error) {
            throw new BadRequestException('Error getting address count');
        }
    }

    // Validate address format (can be extended)
    async validateAddress(addressId: string, userId: string) {
        try {
            const address = await this.addressModel
                .findOne({ _id: addressId, user: userId, isActive: true })
                .exec();

            if (!address) {
                throw new NotFoundException('Address not found');
            }

            const isValid =
                address.fullName &&
                address.phone &&
                address.addressLine1 &&
                address.city &&
                address.state &&
                address.zipCode &&
                address.country;

            return {
                success: true,
                isValid,
                data: address,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error validating address');
        }
    }
}