import { Request, Response } from 'express';
import { ShippingService, AdminLogsService } from '../services';
import {
    ShippingLocationNotFoundError,
    ShippingMethodNotFoundError,
    EmptyCartError,
    CartNotFoundError,
} from '../errors';
import { JwtPayload } from 'jsonwebtoken';

export class ShippingController {
    private shippingService: ShippingService;
    private adminLogsService: AdminLogsService | null;

    constructor(
        shippingService: ShippingService,
        adminLogsService: AdminLogsService | null = null
    ) {
        this.shippingService = shippingService;
        this.adminLogsService = adminLogsService;
    }

    public async addShippingCountry(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const { username } = req.user as JwtPayload;
        const { name, rate } = req.body;

        try {
            const country = await this.shippingService.addShippingCountry(
                name,
                rate
            );
            res.status(200).json({
                message: 'Country added successfully',
                country,
            });

            await this.adminLogsService!.log(username, 'country', 'create');
        } catch (error) {
            console.error('Error adding new country: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async addCityToCountry(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const countryId: number = Number(req.params.id);
        const { username } = req.user as JwtPayload;
        const { name, postalCode } = req.body;

        try {
            const city = await this.shippingService.addCityToCountry(
                countryId,
                name,
                postalCode
            );

            res.status(200).json({ message: 'City added successfully', city });

            await this.adminLogsService!.log(username, 'city', 'create');
        } catch (error) {
            if (error instanceof ShippingLocationNotFoundError) {
                console.error('Error adding city: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error adding city: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getShippingCountries(
        _req: Request,
        res: Response
    ): Promise<void | Response> {
        try {
            const shippingCountries =
                await this.shippingService.getShippingCountries();
            return res.status(200).json({ shippingCountries });
        } catch (error) {
            console.error('Error getting shipping countries: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getShippingCitiesByCountryId(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const countryId: number = Number(req.params.id);

        try {
            const shippingCities =
                await this.shippingService.getShippingCitiesByCountryId(
                    countryId
                );
            return res.status(200).json({ shippingCities });
        } catch (error) {
            if (error instanceof ShippingLocationNotFoundError) {
                console.error('Error getting shipping cities: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error getting shipping cities: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async calculateShippingCost(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const cartId: number = Number(req.params.id);
        const { countryName, shippingMethod } = req.body;

        try {
            const shippingCost =
                await this.shippingService.calculateShippingCost(
                    cartId,
                    countryName,
                    shippingMethod
                );
            return res.status(200).json({ shippingCost });
        } catch (error) {
            if (error instanceof CartNotFoundError) {
                console.error('Error calculating shipping cost: ', error);
                return res.status(404).json({ message: error.message });
            }

            if (error instanceof ShippingLocationNotFoundError) {
                console.error('Error determining weight range: ', error);
                return res.status(404).json({ message: error.message });
            }

            if (error instanceof ShippingMethodNotFoundError) {
                console.error('Error determining weight range: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error determining weight range: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async determineWeightRangeByCartId(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const cartId: number = Number(req.params.id);

        try {
            const weight =
                await this.shippingService.determineWeightRangeByCartId(cartId);
            return res.status(200).json({ weight });
        } catch (error) {
            if (error instanceof EmptyCartError) {
                console.error('Error determining weight range: ', error);
                return res.status(400).json({ message: error.message });
            }

            console.error('Error determining weight range: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async updateShippingCountry(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const countryId: number = Number(req.params.id);
        const { username } = req.user as JwtPayload;
        const { name, rate } = req.body;

        try {
            const updatedCountry =
                await this.shippingService.updateShippingCountry(
                    countryId,
                    name,
                    rate
                );

            res.status(200).json({
                message: 'Country updated successfully',
                updatedCountry,
            });

            await this.adminLogsService!.log(username, 'country', 'update');
        } catch (error) {
            if (error instanceof ShippingLocationNotFoundError) {
                console.error('Error updating country: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error updating country: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async updateShippingCity(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const countryId: number = Number(req.params.countryId);
        const cityId: number = Number(req.params.id);
        const { username } = req.user as JwtPayload;
        const { name, postalCode } = req.body;

        try {
            const updatedCity = await this.shippingService.updateShippingCity(
                countryId,
                cityId,
                name,
                postalCode
            );

            res.status(200).json({
                message: 'City updated successfully',
                updatedCity,
            });

            await this.adminLogsService!.log(username, 'city', 'update');
        } catch (error) {
            if (error instanceof ShippingLocationNotFoundError) {
                console.error('Error updating city: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error updating city: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async changeShippingWeightRate(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const { username } = req.user as JwtPayload;
        const { type, rate } = req.body;

        try {
            const updatedRate =
                await this.shippingService.changeShippingWeightRate(type, rate);

            res.status(200).json({
                message: 'Shipping weight rate updated successfully',
                updatedRate,
            });

            await this.adminLogsService!.log(
                username,
                'shipping weight',
                'update'
            );
        } catch (error) {
            console.error('Error changing shipping weight rate: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async changeShippingMethodRate(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const { username } = req.user as JwtPayload;
        const { type, rate } = req.body;

        try {
            const updatedRate =
                await this.shippingService.changeShippingMethodRate(type, rate);

            res.status(200).json({
                message: 'Shipping method rate updated successfully',
                updatedRate,
            });

            await this.adminLogsService!.log(
                username,
                'shipping method',
                'update'
            );
        } catch (error) {
            console.error('Error changing shipping method rate: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async deleteShippingCountry(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const countryId: number = Number(req.params.id);
        const { username } = req.user as JwtPayload;

        try {
            await this.shippingService.deleteShippingCountry(countryId);

            res.sendStatus(204);

            await this.adminLogsService!.log(username, 'country', 'delete');
        } catch (error) {
            if (error instanceof ShippingLocationNotFoundError) {
                console.error('Error deleting country: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error deleting country: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async deleteShippingCity(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const countryId: number = Number(req.params.countryId);
        const cityId: number = Number(req.params.id);
        const { username } = req.user as JwtPayload;

        try {
            await this.shippingService.deleteShippingCity(countryId, cityId);

            res.sendStatus(204);

            await this.adminLogsService!.log(username, 'city', 'delete');
        } catch (error) {
            if (error instanceof ShippingLocationNotFoundError) {
                console.error('Error deleting city: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error deleting city: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
}
