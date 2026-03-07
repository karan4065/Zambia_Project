import React, { useEffect, useState } from 'react';
import {
  addControlValues, addStandard, currentSession, uploadSchoolLogo,
  getAllStandards, updateStandard, deleteStandard, getSubjectsForStandard,
  deleteSubject, addSubjectsWithInstallment, getAllSessions, fetchInstallments
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

const Control: React.FC = () => {
  // State declarations - organized at top
  const [Standard, setStandard] = useState<string>('');
  const [standardCategory, setStandardCategory] = useState<string>('Kindergarten');
  const [StandardTotalFees, setStandardTotalFees] = useState<number>(0);
  const [dropdownStandard, setDropdownStandard] = useState<string>('');
  const [SubString, setSubString] = useState<string>('');
  const [subjectTotalMarks, setSubjectTotalMarks] = useState<string>('100');

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
  const [standard, setStandardList] = useState<string[]>(['1st']);
  const [input1, setInput1] = useState<string>('');
  const [input2, setInput2] = useState<string>('');

  // CRUD States
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionForConfig, setSelectedSessionForConfig] = useState<string>("");
const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false);
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

  // Fetch standards on component mount
  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const response = await axios.get('http://localhost:5000/standards');
        const standardsData = response.data?.standard || [];
        const standardArr = standardsData.map((ele: { std: string; id: number }) => ele.std);
        setStandardList(standardArr);
      } catch (error) {
        console.error('Error fetching standards:', error);
      }
    };
    fetchStandards();
    loadSessions();
    loadInstallments();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // when a session is selected we load its existing control configuration
  useEffect(() => {
    const fetchConfig = async () => {
      if (!selectedSessionForConfig) return;
      setIsLoadingConfig(true);
      try {
        const cfg = await fetchControlConfig(selectedSessionForConfig);
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

  // fetch config for selected session
  useEffect(() => {
    const fetchConfig = async () => {
      if (!selectedSessionForConfig) return;
      setIsLoadingConfig(true);
      try {
        const cfg = await fetchControlConfig(selectedSessionForConfig);
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

  const loadSubjectsForStandard = async (std: string) => {
    try {
      const data = await getSubjectsForStandard(std);
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
      await updateStandard(std.std, {
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

  const handleDeleteStandard = async (std: string) => {
    if (window.confirm(`Are you sure you want to delete standard ${std}?`)) {
      try {
        await deleteStandard(std);
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
          loadSubjectsForStandard(selectedSubjectsStandard);
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject');
      }
    }
  };

  const handleSubmitSubjects = async () => {
    try {
      if (!SubString.trim()) {
        alert('Please enter subjects');
        return;
      }
      if (!dropdownStandard) {
        alert('Please select a standard');
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
        std: dropdownStandard,
        subjects: subjectsArray,
      };

      const res = await addSubjectsWithInstallment(data);
      if (res) {
        alert('Subjects Added Successfully');
        setSubString('');
        setSubjectTotalMarks('100');
        if (selectedSubjectsStandard === dropdownStandard) {
          loadSubjectsForStandard(dropdownStandard);
        }
      }
    } catch (error) {
      console.error('Error adding subjects:', error);
      alert('Failed to add subjects');
    }
  };

  const handleControlChanges = async () => {
    try {
      if (!selectedSessionForConfig) {
        alert('Please select a session before saving configuration.');
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
      };

      const controlDataStatus = await addControlValues(data);
      if (controlDataStatus) {
        alert('Data Added Successfully');
        // Notify other parts of the app (e.g., Navbar) to refresh config for this session
        try {
          window.dispatchEvent(new CustomEvent('controlUpdated', { detail: { year: selectedSessionForConfig } }));
        } catch (e) { }
      }
    } catch (error) {
      const errorData = error as AxiosError<{ errorMsg: string }>;
      if (errorData?.response?.status === 400) {
        alert(errorData?.response?.data?.errorMsg || 'An unknown error occurred.');
      } else {
        alert('Something went wrong. Please try again later.');
      }
    }
  };

  const handleInstallment = async () => {
    try {
      if (!installment.trim()) {
        alert('Please enter installment name');
        return;
      }
      await axios.post('http://localhost:5000/handleInstallments', {
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
      const res = await axios.post('http://localhost:5000/updateinstallment', {
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
      window.location.href = 'http://localhost:5000/api/backup';
    } catch (error) {
      console.error('Error triggering backup:', error);
      alert('Failed to start backup');
    }
  };

  const studentPromoteRoute = async () => {

    try {
      const promotionData = await axios.post('http://localhost:5000/promotion');
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
          <option value="Kindergarten">Kindergarten</option>
          <option value="Primary">Primary</option>
          <option value="Junior Secondary">Junior Secondary</option>
          <option value="Senior Secondary">Senior Secondary</option>
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
                      onClick={() => handleDeleteStandard(std.std)}
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
                <option value="Kindergarten">Kindergarten</option>
                <option value="Primary">Primary</option>
                <option value="Junior Secondary">Junior Secondary</option>
                <option value="Senior Secondary">Senior Secondary</option>
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
        <select name="standard" value={dropdownStandard} onChange={handleDropdownStandardChange}>
          <option value="">Select standard</option>
          {standard.map((ele, key) => (
            <option key={key} value={ele}>
              {ele}
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
              if (e.target.value) loadSubjectsForStandard(e.target.value);
            }}
          >
            <option value="">Select Standard</option>
            {standards.map(std => (
              <option key={std.id} value={std.std}>{std.std}</option>
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
        <label>Session:</label>
        <select value={selectedSessionForConfig} onChange={(e) => setSelectedSessionForConfig(e.target.value)}>
          <option value="">Select Session (required)</option>
          {sessions.map(s => (
            <option key={s.id} value={s.year}>{s.year}</option>
          ))}
        </select>
        <button onClick={handleControlChanges}>Submit</button>
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