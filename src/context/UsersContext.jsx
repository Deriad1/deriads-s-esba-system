import { createContext, useContext, useState, useEffect } from "react";
import { addTeacher as addTeacherAPI, getTeachers } from '../api-client';

const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load teachers from database on mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await getTeachers();
        if (response.status === 'success') {
          setTeachers(response.data);
        }
      } catch (error) {
        console.error('Failed to load teachers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeachers();
  }, []);

  const addTeacher = async (teacher) => {
    // Call the API to add teacher (password will be hashed in api.js)
    const response = await addTeacherAPI(teacher);

    if (response.status === 'success') {
      // Update local state with the new teacher
      setTeachers((prev) => [...prev, response.data]);
      return response.data;
    } else {
      throw new Error('Failed to add teacher');
    }
  };

  return (
    <UsersContext.Provider value={{ teachers, addTeacher, isLoading }}>
      {children}
    </UsersContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => useContext(UsersContext);
