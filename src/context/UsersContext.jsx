import { createContext, useContext, useState } from "react";

const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const [teachers, setTeachers] = useState([
    { id: 1, firstName: "John", email: "teacher@example.com", password: "teacher123", gender: "male" },
  ]);

  const addTeacher = (teacher) => {
    setTeachers((prev) => [...prev, { id: prev.length + 1, ...teacher }]);
  };

  return (
    <UsersContext.Provider value={{ teachers, addTeacher }}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => useContext(UsersContext);
