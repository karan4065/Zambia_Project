import React, { useEffect, useState } from 'react';
import {
  addControlValues, addStandard, currentSession, uploadSchoolLogo,
  getAllStandards, updateStandard, deleteStandard, getSubjectsForStandard,
  deleteSubject, addSubjectsWithInstallment, getAllSessions, fetchInstallments,
  fetchControlConfig, fetchCategories, addCategory, deleteCategory,
  fetchUsers, addUser, deleteUser,
  fetchColleges, addCollege, deleteCollege
} from '../apis/api';
import { useSetRecoilState } from 'recoil';
import { installmentArr } from '../store/store';
import axios from 'axios';
import { AxiosError } from 'axios';
import '../styles/Control.css';

interface Standard {
  id: number;
  std: string;
  category: string;
  totalFees: number;
}

interface Subject {
  id: number;
  name: string;
  totalMarks?: number;
  installment?: { id: number; installments: string };
}

interface Session {
  id: number;
  year: string;
  createdAt: string;
}

interface Installment {
  id: number;
  installments: string;
}

interface Category {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  college?: string;
}

interface College {
  id: number;
  name: string;
}

const Control: React.FC = () => {
  // State declarations - organized at top
  const userRole = localStorage.getItem('userRole');
  const userCollege = localStorage.getItem('userCollege');

  const [Standard, setStandard] = useState<string>('');
  const [standardCategory, setStandardCategory] = useState<string>('');
  const [StandardTotalFees, setStandardTotalFees] = useState<number>(0);
  const [dropdownStandard, setDropdownStandard] = useState<string>('');
  const [SubString, setSubString] = useState<string>('');
  const [subjectTotalMarks, setSubjectTotalMarks] = useState<string>('100');
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [showManageCategories, setShowManageCategories] = useState<boolean>(false);
  const [showManageUsers, setShowManageUsers] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<string>('teacher');
  const [newUserCollege, setNewUserCollege] = useState<string>('');
  const [showNewCollegeInput, setShowNewCollegeInput] = useState<boolean>(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [newCollegeName, setNewCollegeName] = useState<string>('');
  const [showManageColleges, setShowManageColleges] = useState<boolean>(false);

  const [num_of_beds, setNum_of_beds] = useState<number>(0);
  const [InstitutionName, setInstitutionName] = useState<string>('');
  const [hostelName, setHostelName] = useState<string>('');
  const [schoolAddress, setSchoolAddress] = useState<string>('');
  const [totalFee, setTotalFee] = useState<number>(0);
  const [lunchFee, setLunchFee] = useState<number>(0);
  const [installment, setInstallment] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [newinstallment, setNewinstallment] = useState<boolean>(false);
  const [uinstallment, setUinstallment] = useState<string>('');
  const [uinstallment2, setUinstallment2] = useState<string>('');
  const [input1, setInput1] = useState<string>('');
  const [input2, setInput2] = useState<string>('');

  // CRUD States
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionForConfig, setSelectedSessionForConfig] = useState<string>("");
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false);
  const [configStatus, setConfigStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  // Keep isLoadingConfig used to satisfy lint
  useEffect(() => {
    if (isLoadingConfig) console.log("Loading config...");
  }, [isLoadingConfig]);
  const [installments, setInstallments] = useState<Installment[]>([]);

  const setGlobalInstallments = useSetRecoilState(installmentArr);

  // Keep a minimal reference to `installments` so the compiler knows it's used
  useEffect(() => {
    // noop reference to avoid unused variable error
    void installments;
  }, [installments]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showManageStandards, setShowManageStandards] = useState<boolean>(false);
  const [showManageSubjects, setShowManageSubjects] = useState<boolean>(false);
  const [showManageSessions, setShowManageSessions] = useState<boolean>(false);
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null);
  const [editedTotalFees, setEditedTotalFees] = useState<number>(0);
  const [editedCategory, setEditedCategory] = useState<string>('');
  const [selectedSubjectsStandard, setSelectedSubjectsStandard] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editedUsername, setEditedUsername] = useState<string>('');
  const [editedPassword, setEditedPassword] = useState<string>('');
  const [editedUserRole, setEditedUserRole] = useState<string>('');

  // Fetch standards on component mount
  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const response = await axios.get(`http://${window.location.hostname}:5000/standards`);
        const standardsData = response.data?.standard || [];
        setStandards(standardsData);
      } catch (error) {
      }
    };
    fetchStandards();
    loadSessions();
    loadInstallments();
    loadCategories();
    loadUsers();
    loadColleges();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
      if (data.length > 0) {
        setStandardCategory(data[0].name);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadColleges = async () => {
    try {
      const data = await fetchColleges();
      setColleges(data);
      if (data.length > 0 && !newUserCollege) {
        setNewUserCollege(data[0].name);
      }
      // Notify other components (like Login in App.tsx)
      window.dispatchEvent(new CustomEvent('collegesUpdated'));
    } catch (error) {
      console.error('Error loading colleges:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // fetch config for selected session
  useEffect(() => {
    const fetchConfig = async () => {
      if (!selectedSessionForConfig) return;
      setIsLoadingConfig(true);
      try {
        const college = localStorage.getItem('userCollege');
        const cfg = await fetchControlConfig(selectedSessionForConfig, college || undefined);
        if (cfg) {
          setInstitutionName(cfg.Institution_name || '');
          setHostelName(cfg.Institution_hostel_name || '');
          setSchoolAddress(cfg.SchoolAddress || '');
          setNum_of_beds(cfg.number_of_hostel_bed || 0);
          setTotalFee(cfg.TotalFees || 0);
          setLunchFee(cfg.lunchFee || 0);
          setUrl(cfg.SchoolLogo || '');
        }
      } catch (e) {
        console.error('Failed to load control config for session', e);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [selectedSessionForConfig]);

  const loadInstallments = async () => {
    try {
      const data = await fetchInstallments();
      setInstallments(data || []);
      // also update global recoil atom for other pages
      if (Array.isArray(data)) {
        const mapped = data.map((d: any) => (d.installments ? d.installments : d));
        setGlobalInstallments(mapped);
      }
    } catch (error) {
      console.error('Error loading installments:', error);
    }
  };

  const loadAllStandards = async () => {
    try {
      const data = await getAllStandards();
      setStandards(data);
    } catch (error) {
      console.error('Error loading standards:', error);
    }
  };

  const loadSubjectsForStandard = async (id: number) => {
    try {
      const data = await getSubjectsForStandard(id);
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  // Handle functions
  const handleChangeStandard = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStandard(e.target.value);
  };

  const handleDropdownStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDropdownStandard(e.target.value);
  };

  const handleChangeSubject = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubString(e.target.value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const photoUrl = await uploadSchoolLogo(file);
        setUrl(photoUrl);
      } catch (error) {
        console.error(error);
        alert('Failed to upload image');
      }
    }
  };

  // Submit handlers
  const handleSubmitStandard = async () => {
    try {
      if (!Standard.trim()) {
        alert('Please provide Standard');
        return;
      }

      const data = {
        std: Standard,
        totalFees: StandardTotalFees,
        category: standardCategory,
      };

      const res = await addStandard(data);
      if (res) {
        alert('Standard Added Successfully');
        setStandard('');
        setStandardTotalFees(0);
        loadAllStandards();
      }
    } catch (error) {
      console.error('Error adding standard:', error);
      alert('Already Exist');
    }
  };

  const handleUpdateStandard = async (std: Standard) => {
    try {
      if (!std.id) throw new Error("Standard ID missing");
      await updateStandard(std.id, {
        totalFees: editedTotalFees,
        category: editedCategory
      });
      alert('Standard updated successfully');
      setEditingStandard(null);
      loadAllStandards();
    } catch (error) {
      console.error('Error updating standard:', error);
      alert('Failed to update standard');
    }
  };

  const handleDeleteStandard = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete standard ${name}?`)) {
      try {
        await deleteStandard(id);
        alert('Standard deleted successfully');
        loadAllStandards();
      } catch (error: any) {
        console.error('Error deleting standard:', error);
        alert(error.message || 'Failed to delete standard');
      }
    }
  };

  const handleDeleteSubject = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete subject ${name}?`)) {
      try {
        await deleteSubject(id);
        alert('Subject deleted successfully');
        if (selectedSubjectsStandard) {
          loadSubjectsForStandard(parseInt(selectedSubjectsStandard));
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject');
      }
    }
  };

  const handleSubmitSubjects = async () => {
    try {
      if (!dropdownStandard) {
        alert("Please select a valid standard");
        return;
      }

      const standardId = parseInt(dropdownStandard);

      if (!SubString.trim()) {
        alert('Please enter subjects');
        return;
      }

      const totalMarks = parseFloat(subjectTotalMarks);
      if (isNaN(totalMarks) || totalMarks <= 0) {
        alert('Total marks must be a positive number');
        return;
      }

      const subjectsArray = SubString.trim()
        .split(' ')
        .map((subject) => ({
          name: subject,
          totalMarks: totalMarks
        }));

      const data = {
        stdId: standardId,
        subjects: subjectsArray,
      };

      const res = await addSubjectsWithInstallment(data);
      if (res) {
        alert('Subjects Added Successfully');
        setSubString('');
        setSubjectTotalMarks('100');
        if (selectedSubjectsStandard === dropdownStandard) {
          loadSubjectsForStandard(standardId);
        }
      }
    } catch (error: any) {
      console.error('Error adding subjects:', error);
      const detail = error.response?.data?.details || error.message || '';
      alert(`Failed to add subjects. ${detail}`);
    }
  };

  const handleControlChanges = async () => {
    setConfigStatus(null);
    try {
      if (!selectedSessionForConfig) {
        setConfigStatus({ type: 'error', message: 'Please select a session before saving configuration.' });
        return;
      }

      const data = {
        num_of_beds,
        InstitutionName,
        hostelName,
        schoolAddress,
        totalFee,
        url,
        lunchFee,
        year: selectedSessionForConfig,
        college: localStorage.getItem('userCollege') || undefined,
      };

      const res = await addControlValues(data);
      if (res) {
        setConfigStatus({ type: 'success', message: `Configuration for ${selectedSessionForConfig} updated successfully!` });
        // Notify other parts of the app
        try {
          window.dispatchEvent(new CustomEvent('controlUpdated', { detail: { year: selectedSessionForConfig } }));
        } catch (e) { }
      }
    } catch (error: any) {
      console.error('Control update error:', error);
      const errMsg = error.response?.data?.error || error.response?.data?.errorMsg || error.message || 'Something went wrong';
      setConfigStatus({ type: 'error', message: `Failed to update: ${errMsg}` });
    }
  };

  const handleInstallment = async () => {
    try {
      if (!installment.trim()) {
        alert('Please enter installment name');
        return;
      }
      await axios.post(`http://${window.location.hostname}:5000/handleInstallments`, {
        installments: installment,
      });
      alert('Added Successfully');
      setInstallment('');
      loadInstallments();
    } catch (err) {
      alert('Already exist');
    }
  };

  const updateInstallment = async () => {
    try {
      if (!uinstallment.trim() || !uinstallment2.trim()) {
        alert('Please fill both fields');
        return;
      }
      const res = await axios.post(`http://${window.location.hostname}:5000/updateinstallment`, {
        uinstallment,
        uinstallment2,
      });
      if (res) {
        alert('Installment Updated Successfully');
        setUinstallment('');
        setUinstallment2('');
        setNewinstallment(false);
        loadInstallments();
      }
    } catch (err) {
      console.log(err);
      alert('Failed to update installment');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory(newCategoryName);
      alert('Category added successfully');
      setNewCategoryName('');
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
        alert('Category deleted successfully');
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert("Username and password are required.");
      return;
    }
    
    const collegeName = newUserCollege === "new" ? newCollegeName.trim() : newUserCollege.trim();
    if (!collegeName) {
      alert("College name is required.");
      return;
    }

    try {
      // If admin, enforce their own college. If not (superadmin?), use selected or default.
      const collegeName = userRole === 'admin' ? userCollege : (newUserCollege === "new" ? newCollegeName.trim() : newUserCollege.trim());
      
      if (!collegeName) {
        alert("College name is required.");
        return;
      }

      // Auto-add new college if needed (only for superadmins or when allowed)
      const existingCollege = colleges.find(c => c.name.toLowerCase() === collegeName.toLowerCase());
      if (!existingCollege && userRole !== 'admin') {
        try {
          await addCollege(collegeName);
          await loadColleges(); 
        } catch (e) {
          console.warn('Could not auto-add college:', e);
        }
      }

      await addUser({ username: newUsername, password: newPassword, role: newUserRole, college: collegeName });
      alert('User added successfully');
      setNewUsername('');
      setNewPassword('');
      setNewUserRole('teacher');
      setNewUserCollege(userCollege || (colleges.length > 0 ? colleges[0].name : ''));
      setNewCollegeName('');
      setShowNewCollegeInput(false);
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user (Username might exist)');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        alert('User deleted successfully');
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editedUsername.trim()) {
      alert("Username is required.");
      return;
    }

    try {
      await updateUser(editingUser.id, {
        username: editedUsername,
        password: editedPassword || undefined, // Only update password if provided
        role: editedUserRole
      });
      alert('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleAddCollege = async () => {
    if (!newCollegeName.trim()) return;
    try {
      await addCollege(newCollegeName);
      alert('College added successfully');
      setNewCollegeName('');
      loadColleges();
    } catch (error) {
      console.error('Error adding college:', error);
      alert('Failed to add college');
    }
  };

  const handleDeleteCollege = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this college?')) {
      try {
        await deleteCollege(id);
        alert('College deleted successfully');
        loadColleges();
      } catch (error) {
        console.error('Error deleting college:', error);
        alert('Failed to delete college');
      }
    }
  };

  const handleAddSession = async () => {
    try {
      if (input1 && input2) {
        const newSession = input1 + '-' + input2;
        const response = await currentSession(newSession);

        if (response.status === 200) {
          alert('Session Added Successfully');
          setInput1('');
          setInput2('');
          loadSessions();
        }
      } else {
        alert('Both start year and end year are required.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        if (status === 409) {
          alert(data.error || 'Session already exists');
        } else if (status === 400) {
          alert(data.error || 'Year is required');
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      } else {
        console.error('Error:', error);
        alert('An error occurred. Please check the console for details.');
      }
    }
  };

  const handleBackup = async () => {
    try {
      // Trigger download from backend
      window.location.href = `http://${window.location.hostname}:5000/api/backup`;
    } catch (error) {
      console.error('Error triggering backup:', error);
      alert('Failed to start backup');
    }
  };

  const studentPromoteRoute = async () => {

    try {
      const promotionData = await axios.post(`http://${window.location.hostname}:5000/promotion`);
      if (promotionData) {
        alert('Student Promoted Successfully');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error promoting students:', error);
      alert('Failed to promote students');
    }
  };

  return (
    <div className="global-container">
      <h1>Control Panel</h1>

      {/* Add Standard Section */}
      <div className="control-section">
        <h2>Add Standard</h2>
        <label>Enter Standards:</label>
        <label>Category:</label>
        <select value={standardCategory} onChange={(e) => setStandardCategory(e.target.value)}>
          {Array.isArray(categories) && categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        <input
          title="Standard Formating - LKG, UKG, 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th, 10th"
          type="text"
          placeholder="Standard"
          value={Standard}
          onChange={handleChangeStandard}
        />
        <label>Total Fees for this Standard:</label>
        <input
          type="number"
          placeholder="Enter Total Fees"
          value={StandardTotalFees}
          onChange={(e) => setStandardTotalFees(Number(e.target.value))}
        />
        <label>Session:</label>
        <select defaultValue="">
          <option value="">Current Session</option>
          {sessions.map(s => (
            <option key={s.id} value={s.year}>{s.year}</option>
          ))}
        </select>
        <button className="btn" onClick={handleSubmitStandard}>
          Submit
        </button>
        <button className="btn manage-btn" onClick={() => { setShowManageStandards(!showManageStandards); if (!showManageStandards) loadAllStandards(); }}>
          {showManageStandards ? 'Hide' : 'Manage'} Standards
        </button>
      </div>

      {/* Manage Teachers and Admin Section */}
      <div className="control-section">
        <h2>Manage Teachers and Admin</h2>
        <div className="add-form" style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {userRole === 'admin' ? (
            <input type="text" value={userCollege || ''} disabled style={{ backgroundColor: '#f3f4f6' }} />
          ) : (
            <>
              <select 
                value={newUserCollege} 
                onChange={(e) => {
                  setNewUserCollege(e.target.value);
                  setShowNewCollegeInput(e.target.value === "new");
                }}
              >
                {colleges.map(col => (
                  <option key={col.id} value={col.name}>{col.name}</option>
                ))}
                <option value="new">+ Add New College...</option>
              </select>
              {showNewCollegeInput && (
                <input
                  type="text"
                  placeholder="Enter New College Name"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                />
              )}
            </>
          )}
          <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
          </select>
          <button className="btn" onClick={handleAddUser}>Add User</button>
        </div>
        <table className="manage-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>College</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(users) && users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                <td>{user.college || 'N/A'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setEditingUser(user);
                        setEditedUsername(user.username);
                        setEditedPassword('');
                        setEditedUserRole(user.role);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingUser && (
          <div className="edit-modal" style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <h4>Edit User: {editingUser.username}</h4>
            <div className="add-form">
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>Username</label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  placeholder="********"
                  value={editedPassword}
                  onChange={(e) => setEditedPassword(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>Role</label>
                <select value={editedUserRole} onChange={(e) => setEditedUserRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn" onClick={handleUpdateUser}>Update Details</button>
                <button className="btn" style={{ backgroundColor: '#6b7280' }} onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Manage Categories Section */}
      <div className="control-section">
        <h2>Manage Categories</h2>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="New Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button className="btn" onClick={handleAddCategory}>Add Category</button>
        </div>
        <table className="manage-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(categories) && categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manage Standards Section */}
      {showManageStandards && (
        <div className="manage-section">
          <h3>Manage Standards</h3>
          <table className="manage-table">
            <thead>
              <tr>
                <th>Standard</th>
                <th>Category</th>
                <th>Total Fees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {standards.map(std => (
                <tr key={std.id}>
                  <td>{std.std}</td>
                  <td>{std.category || 'N/A'}</td>
                  <td>₹{std.totalFees || 0}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setEditingStandard(std);
                        setEditedTotalFees(std.totalFees);
                        setEditedCategory(std.category);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteStandard(std.id, std.std)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {editingStandard && (
            <div className="edit-form">
              <h4>Edit Standard: {editingStandard.std}</h4>
              <input
                type="number"
                value={editedTotalFees}
                onChange={(e) => setEditedTotalFees(Number(e.target.value))}
                placeholder="Total Fees"
              />
              <select value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <button onClick={() => handleUpdateStandard(editingStandard)}>Update</button>
              <button onClick={() => setEditingStandard(null)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      <br />

      {/* Add Subjects Section */}
      <div className="control-section">
        <h2>Add Subjects</h2>
        <select value={dropdownStandard} onChange={handleDropdownStandardChange}>
          <option value="">Select Standard</option>
          {standards.map((std) => (
            <option key={std.id} value={std.id}>
              {std.std} ({std.category || 'N/A'})
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Subject (space separated)"
          value={SubString}
          onChange={handleChangeSubject}
        />
        <label>Total Marks for Subject(s):</label>
        <input
          type="number"
          placeholder="Enter total marks"
          value={subjectTotalMarks}
          onChange={(e) => setSubjectTotalMarks(e.target.value)}
          min="1"
          step="0.5"
        />
        <label>Session:</label>
        <select defaultValue="">
          <option value="">Current Session</option>
          {sessions.map(s => (
            <option key={s.id} value={s.year}>{s.year}</option>
          ))}
        </select>
        <button className="btn" onClick={handleSubmitSubjects}>
          Submit
        </button>
        <button className="btn manage-btn" onClick={() => { setShowManageSubjects(!showManageSubjects); setSelectedSubjectsStandard(''); }}>
          {showManageSubjects ? 'Hide' : 'Manage'} Subjects
        </button>
      </div>

      {/* Manage Subjects Section */}
      {showManageSubjects && (
        <div className="manage-section">
          <h3>Manage Subjects</h3>
          <select
            value={selectedSubjectsStandard}
            onChange={(e) => {
              setSelectedSubjectsStandard(e.target.value);
              if (e.target.value) loadSubjectsForStandard(parseInt(e.target.value));
            }}
          >
            <option value="">Select Standard</option>
            {standards.map(std => (
              <option key={std.id} value={std.id}>{std.std} ({std.category || 'N/A'})</option>
            ))}
          </select>

          {selectedSubjectsStandard && subjects.length > 0 && (
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Total Marks</th>
                  <th>Installment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(subj => (
                  <tr key={subj.id}>
                    <td>{subj.name}</td>
                    <td>{subj.totalMarks || 100}</td>
                    <td>{subj.installment?.installments || 'None'}</td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteSubject(subj.id, subj.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <hr style={{ margin: '30px 0px' }} />

      {/* Set Configurations Section */}
      <div className="control-section">
        <h2>Set Configurations</h2>
        <label>Set Institute Name:</label>
        <input
          type="text"
          placeholder="Enter institution name"
          value={InstitutionName}
          onChange={(e) => setInstitutionName(e.target.value)}
        />
        <label>Set School Logo</label>
        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} />
        <label>Set Hostel Name:</label>
        <input
          type="text"
          placeholder="Enter Hostel Name"
          value={hostelName}
          onChange={(e) => setHostelName(e.target.value)}
        />
        <label>Set School Address</label>
        <input
          type="text"
          placeholder="Enter School Address"
          value={schoolAddress}
          onChange={(e) => setSchoolAddress(e.target.value)}
        />
        <label>Set Hostel Beds:</label>
        <input
          type="number"
          placeholder="Enter Number of Hostel Beds"
          value={num_of_beds}
          onChange={(e) => setNum_of_beds(Number(e.target.value))}
        />
        <label>Set Total Fees</label>
        <input
          type="number"
          placeholder="Enter Total Fees"
          value={totalFee}
          onChange={(e) => setTotalFee(Number(e.target.value))}
        />
        <label>Set Lunch Fee (Monthly)</label>
        <input
          type="number"
          placeholder="Enter Lunch Fee"
          value={lunchFee}
          onChange={(e) => setLunchFee(Number(e.target.value))}
        />
        <select value={selectedSessionForConfig} onChange={(e) => setSelectedSessionForConfig(e.target.value)}>
          <option value="">Select Session (required)</option>
          {sessions.map(s => (
            <option key={s.id} value={s.year}>{s.year}</option>
          ))}
        </select>

        {isLoadingConfig && <p style={{ color: '#3b82f6', fontSize: '14px' }}>Loading configuration data...</p>}
        
        {configStatus && (
          <div style={{ 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            backgroundColor: configStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: configStatus.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${configStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {configStatus.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={handleControlChanges}>Submit</button>
          <button className="btn" style={{ backgroundColor: '#4f46e5' }} onClick={handleControlChanges}>Update</button>
        </div>
      </div>

      <br />

      {/* Add Installments Section */}
      <div className="control-section">
        <h2>Add Installments</h2>
        <label>Installment Name:</label>
        <input
          type="text"
          placeholder="Enter Installment Name"
          value={installment}
          onChange={(e) => setInstallment(e.target.value)}
        />
        <label>Session:</label>
        <select defaultValue="">
          <option value="">Current Session</option>
          {sessions.map(s => (
            <option key={s.id} value={s.year}>{s.year}</option>
          ))}
        </select>
        <div className="installment-button">
          <button onClick={handleInstallment}>Submit Installment</button>
          <button style={{ marginLeft: '40px' }} onClick={() => setNewinstallment(!newinstallment)}>
            Edit Installment
          </button>
          {newinstallment ? (
            <div style={{ marginTop: '30px' }}>
              <input
                type="text"
                placeholder="Previous installment"
                value={uinstallment}
                onChange={(e) => setUinstallment(e.target.value)}
              />
              <input
                type="text"
                placeholder="New installment"
                value={uinstallment2}
                onChange={(e) => setUinstallment2(e.target.value)}
              />
              <button onClick={updateInstallment}>Update Installment</button>
            </div>
          ) : null}
        </div>
      </div>

      <br />

      {/* Set Sessions Section */}
      <div className="control-section">
        <h2>Set Sessions</h2>
        <label>Add Session:</label>
        <input
          type="text"
          placeholder="Enter start year"
          value={input1}
          onChange={(e) => setInput1(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter end year"
          value={input2}
          onChange={(e) => setInput2(e.target.value)}
        />
        <button onClick={handleAddSession}>Add Session</button>

        <button className="btn manage-btn" onClick={() => setShowManageSessions(!showManageSessions)}>
          {showManageSessions ? 'Hide' : 'View'} Sessions
        </button>

        {showManageSessions && (
          <div className="manage-section">
            <h3>All Sessions</h3>
            {sessions.length > 0 ? (
              <table className="manage-table">
                <thead>
                  <tr>
                    <th>Session Year</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.id}>
                      <td><strong>{session.year}</strong></td>
                      <td>{new Date(session.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No sessions found</p>
            )}
          </div>
        )}
      </div>

      {/* System Maintenance Section */}
      <div className="control-section" style={{ borderTop: '2px solid #ddd', marginTop: '30px', paddingTop: '20px' }}>
        <h2>System Maintenance</h2>
        <div style={{ marginBottom: '20px' }}>
          <label>Database Backup (SQL Format):</label>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
            Clicking this button will download a complete backup of the database, including all tables, data, and relations.
          </p>
          <button className="btn" onClick={handleBackup} style={{ backgroundColor: '#28a745', color: 'white' }}>
            Backup Database
          </button>
        </div>
      </div>

      {/* Danger Zone Section */}

      <div style={{ color: '#8B0000', marginLeft: '5px' }}>
        <h2>Danger Zone - Handle with Caution</h2>
        <div>
          <label>Promote Qualified Students</label>
          <button style={{ marginTop: '5px' }} onClick={studentPromoteRoute}>
            Promote
          </button>
        </div>
      </div>
    </div>
  );
};

export default Control;