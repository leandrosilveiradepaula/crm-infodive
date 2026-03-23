import { useState, useEffect, useCallback } from 'react';
import type { Activity } from '../types/activity';
import {
    getActivities,
    createActivity,
    updateActivity as updateActivityAction,
    deleteActivity as deleteActivityAction
} from '@/app/(dashboard)/activities/actions';
import { toast } from 'sonner';

export const useActivities = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getActivities();
            setActivities(data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching activities:', err);
            setError(err.message || 'Failed to fetch activities');
            toast.error('Failed to load activities');
        } finally {
            setLoading(false);
        }
    }, []);

    const addActivity = async (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newActivity = await createActivity(activity);
            await fetchActivities();
            toast.success('Activity created successfully');
            return newActivity;
        } catch (err: any) {
            console.error('Error creating activity:', err);
            toast.error(err.message || 'Failed to create activity');
            return null;
        }
    };

    const updateActivity = async (id: string, updates: Partial<Activity>) => {
        try {
            await updateActivityAction(id, updates);
            await fetchActivities();
            toast.success('Activity updated successfully');
            return true;
        } catch (err: any) {
            console.error('Error updating activity:', err);
            toast.error(err.message || 'Failed to update activity');
            return false;
        }
    };

    const deleteActivity = async (id: string) => {
        try {
            await deleteActivityAction(id);
            await fetchActivities();
            toast.success('Activity deleted successfully');
            return true;
        } catch (err: any) {
            console.error('Error deleting activity:', err);
            toast.error(err.message || 'Failed to delete activity');
            return false;
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return {
        activities,
        loading,
        error,
        addActivity,
        updateActivity,
        deleteActivity,
        refetch: fetchActivities
    };
};
